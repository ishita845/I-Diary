import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Dumbbell,
  Clock,
  Activity,
  Check,
  Loader,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
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
  Cell,
} from "recharts";

import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";


/* ================= TYPES ================= */

interface Workout {
  id: string;
  exerciseType: string;
  duration: number;
  sets?: number;
  reps?: number;
  notes: string;
}

interface DayWorkout {
  date: string;
  day: string;
  workouts: Workout[];
}

interface WorkoutData {
  month: string;
  dayWorkouts: DayWorkout[];
}

/* ================= CONSTANTS ================= */

const EXERCISE_ICONS = {
  Cardio: "🏃",
  Strength: "💪",
  Yoga: "🧘",
  Dance: "💃",
};

/* ================= COMPONENT ================= */

export function ExerciseTracking() {
  const user = auth.currentUser;
  const uid = user?.uid;

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [dayWorkouts, setDayWorkouts] = useState<DayWorkout[]>([]);
  const [allMonthData, setAllMonthData] = useState<WorkoutData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [newWorkout, setNewWorkout] = useState({
    exerciseType: "",
    duration: "",
    sets: "",
    reps: "",
    notes: "",
  });

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved"
  );
  const [autoSaveTimeout, setAutoSaveTimeout] =
    useState<NodeJS.Timeout | null>(null);

  /* ================= HELPERS ================= */

  const generateMonthEntries = (month: string): DayWorkout[] => {
    const [year, monthNum] = month.split("-").map(Number);
    const days = new Date(year, monthNum, 0).getDate();

    return Array.from({ length: days }, (_, i) => {
      const date = new Date(year, monthNum - 1, i + 1);
      return {
        date: date.toISOString().slice(0, 10),
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        workouts: [],
      };
    });
  };

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!uid) return;

    const loadMonth = async () => {
      const ref = doc(db, "users", uid, "exerciseMonths", selectedMonth);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as WorkoutData;
        setDayWorkouts(data.dayWorkouts || []);
      } else {
        setDayWorkouts(generateMonthEntries(selectedMonth));
      }
    };

    loadMonth();
  }, [uid, selectedMonth]);

  /* ================= SAVE ================= */

  const autoSave = () => {
    if (!uid) return;

    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

    setSaveStatus("saving");

    const timeout = setTimeout(async () => {
      try {
        const cleanDayWorkouts = dayWorkouts.map((d) => ({
          ...d,
          workouts: d.workouts.map((w) => ({
            ...w,
            sets: w.sets ?? null,
            reps: w.reps ?? null,
          })),
        }));

        const ref = doc(db, "users", uid, "exerciseMonths", selectedMonth);
        await setDoc(ref, {
          month: selectedMonth,
          dayWorkouts: cleanDayWorkouts,
        });

        setSaveStatus("saved");
      } catch (e) {
        console.error(e);
        setSaveStatus("error");
      }
    }, 600);

    setAutoSaveTimeout(timeout);
  };

  useEffect(() => {
    if (dayWorkouts.length > 0) autoSave();
  }, [dayWorkouts]);

  /* ================= ACTIONS ================= */

  const addWorkout = (dateStr: string) => {
    if (!newWorkout.duration) return alert("Enter duration");

    const workout: Workout = {
      id: crypto.randomUUID(),
      exerciseType: newWorkout.exerciseType,
      duration: Number(newWorkout.duration),
      sets: newWorkout.sets ? Number(newWorkout.sets) : undefined,
      reps: newWorkout.reps ? Number(newWorkout.reps) : undefined,
      notes: newWorkout.notes,
    };

    setDayWorkouts((prev) =>
      prev.map((d) =>
        d.date === dateStr
          ? { ...d, workouts: [...d.workouts, workout] }
          : d
      )
    );

    setNewWorkout({
      exerciseType: "",
      duration: "",
      sets: "",
      reps: "",
      notes: "",
    });
  };

  const deleteWorkout = (dateStr: string, id: string) => {
    setDayWorkouts((prev) =>
      prev.map((d) =>
        d.date === dateStr
          ? { ...d, workouts: d.workouts.filter((w) => w.id !== id) }
          : d
      )
    );
  };
const calculateWeeklyData = () => {
  const today = new Date();
  const result: { day: string; minutes: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateStr = date.toISOString().slice(0, 10);

    // 🔥 SEARCH ACROSS ALL MONTHS
    let minutes = 0;

    for (const month of allMonthData) {
      const day = month.dayWorkouts.find(d => d.date === dateStr);
      if (day) {
        minutes = day.workouts.reduce((s, w) => s + w.duration, 0);
        break;
      }
    }

    result.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      minutes,
    });
  }

  return result;
};


  const calculateMonthlyData = () => {
    const weeks = [];
    const [year, monthNum] = selectedMonth
      .split("-")
      .map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    let weekNum = 1;
    let weekMinutes = 0;
    let weekWorkouts = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = dayWorkouts.find(
        (d) => d.date === dateStr,
      );

      weekMinutes +=
        dayData?.workouts.reduce(
          (sum, w) => sum + w.duration,
          0,
        ) || 0;
      weekWorkouts += dayData?.workouts.length || 0;

      if (date.getDay() === 6 || day === daysInMonth) {
        weeks.push({
          week: `Week ${weekNum}`,
          minutes: weekMinutes,
          workouts: weekWorkouts,
        });
        weekNum++;
        weekMinutes = 0;
        weekWorkouts = 0;
      }
    }

    return weeks;
  };
   const monthlyData = calculateMonthlyData();

  const handleDateClick = (day: number) => {
    const [year, monthNum] = selectedMonth.split("-");
    const dateStr = `${year}-${monthNum}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
  };
  
  const weeklyData = calculateWeeklyData();
  useEffect(() => {
  if (!uid) return;

  const loadAllMonths = async () => {
    try {
      const monthsRef = collection(db, "users", uid, "exerciseMonths");
      const snap = await getDocs(monthsRef);

      const all: WorkoutData[] = snap.docs.map(d => d.data() as WorkoutData);
      setAllMonthData(all);
    } catch (e) {
      console.error("Failed to load all months", e);
    }
  };

  loadAllMonths();
}, [uid]);


  /* ================= CALENDAR ================= */

  const calendarDays = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  })();

  const datesWithWorkouts = dayWorkouts
    .filter((d) => d.workouts.length)
    .map((d) => d.date);

  const selectedDayData = selectedDate
    ? dayWorkouts.find((d) => d.date === selectedDate)
    : null;

  // Calculate totals
  const totalWorkouts = dayWorkouts.reduce(
    (sum, day) => sum + day.workouts.length,
    0,
  );
  const totalMinutes = dayWorkouts.reduce(
    (sum, day) =>
      sum +
      day.workouts.reduce(
        (daySum, w) => daySum + w.duration,
        0,
      ),
    0,
  );
  const daysWorkedOut = datesWithWorkouts.length;

  /* ================= ANALYTICS ================= */

  const calculateConsistency = () =>
    dayWorkouts.map((d) => ({
      date: d.date.slice(8, 10),
      worked: d.workouts.length > 0 ? 1 : 0,
    }));

  const consistencyData = calculateConsistency();
  const maxTimeWorkout = dayWorkouts.reduce(
    (max, day) => {
      const dayTotal = day.workouts.reduce(
        (sum, w) => sum + w.duration,
        0,
      );
      return dayTotal > max.time
        ? { time: dayTotal, date: day.date }
        : max;
    },
    { time: 0, date: "" },
  );

  // Calculate totals


 
  const avgWorkoutTime =
    totalWorkouts > 0
      ? Math.round(totalMinutes / totalWorkouts)
      : 0;

  
    
   
    
 

  /* ================= UI ================= */




  return (
    <div className="space-y-6">
      {/* Auto-save Status Indicator */}
      <div className="fixed top-20 right-4 z-50">
        <div
          className={`px-4 py-2 rounded-lg shadow-lg border-2 flex items-center gap-2 transition-all ${
            saveStatus === "saving"
              ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100"
              : saveStatus === "saved"
                ? "bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100"
                : "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100"
          }`}
        >
          {saveStatus === "saving" && (
            <Loader className="w-4 h-4 animate-spin" />
          )}
          {saveStatus === "saved" && (
            <Check className="w-4 h-4" />
          )}
          {saveStatus === "error" && <X className="w-4 h-4" />}
          <span className="text-sm font-medium">
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
                ? "Saved"
                : "Error"}
          </span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">
          💪 Exercise Tracker
        </h2>
        <p className="text-pink-700 dark:text-purple-400 italic">
          Track your workouts and build healthy habits •
          Auto-saves as you type
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowAnalytics(false)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            !showAnalytics
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-200 border-2 border-pink-200 dark:border-purple-700"
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Workout Log
        </button>
        <button
          onClick={() => setShowAnalytics(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            showAnalytics
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
              : "bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-200 border-2 border-pink-200 dark:border-purple-700"
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
              const date = new Date(selectedMonth + "-01");
              date.setMonth(date.getMonth() - 1);
              setSelectedMonth(
                date.toISOString().substring(0, 7),
              );
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
              const date = new Date(selectedMonth + "-01");
              date.setMonth(date.getMonth() + 1);
              setSelectedMonth(
                date.toISOString().substring(0, 7),
              );
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
                  {showCalendar ? "Hide" : "Show"} Calendar
                </button>
              </div>

              {showCalendar && (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {[
                      "Sun",
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                    ].map((day) => (
                      <div
                        key={day}
                        className="text-center text-sm text-pink-700 dark:text-purple-300 font-medium py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      if (day === null) {
                        return (
                          <div
                            key={`empty-${index}`}
                            className="aspect-square"
                          />
                        );
                      }

                      const [year, monthNum] =
                        selectedMonth.split("-");
                      const dateStr = `${year}-${monthNum}-${String(day).padStart(2, "0")}`;
                      const hasWorkout =
                        datesWithWorkouts.includes(dateStr);
                      const isSelected =
                        selectedDate === dateStr;
                      const isToday =
                        dateStr ===
                        new Date().toISOString().split("T")[0];

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:shadow-md ${
                            isSelected
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                              : isToday
                                ? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-600"
                                : hasWorkout
                                  ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-900 dark:text-green-100 border-2 border-green-300 dark:border-green-700"
                                  : "bg-pink-50 dark:bg-purple-900/20 text-pink-900 dark:text-purple-100 hover:bg-pink-100 dark:hover:bg-purple-900/40"
                          }`}
                        >
                          <span className="font-medium">
                            {day}
                          </span>
                          {hasWorkout && (
                            <span className="text-xs mt-1">
                              💪
                            </span>
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
                    {new Date(selectedDate!).toLocaleDateString(
                      "en-IN",
                      { day: "2-digit", month: "short" },
                    )}
                    <span className="text-sm text-pink-600 dark:text-purple-400 ml-2">
                      ({selectedDayData.day})
                    </span>
                  </>
                ) : (
                  "Click a date"
                )}
              </h3>

              {selectedDayData ? (
                <div className="space-y-3">
                  {selectedDayData.workouts.length > 0 ? (
                    <>
                      {selectedDayData.workouts.map(
                        (workout) => (
                          <div
                            key={workout.id}
                            className="p-3 rounded-lg bg-white dark:bg-gray-900 border-2 border-pink-200 dark:border-purple-700/50"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">
                                  {EXERCISE_ICONS[
                                    workout.exerciseType as keyof typeof EXERCISE_ICONS
                                  ] || "🏃"}
                                </span>
                                <span className="text-sm font-medium text-pink-900 dark:text-purple-100">
                                  {workout.exerciseType}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  deleteWorkout(
                                    selectedDate!,
                                    workout.id,
                                  )
                                }
                                className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 p-1 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-pink-700 dark:text-purple-300 space-y-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {workout.duration} min
                                </span>
                              </div>
                              {workout.sets && workout.reps && (
                                <div className="flex items-center gap-1">
                                  <Dumbbell className="w-3 h-3" />
                                  <span>
                                    {workout.sets} sets ×{" "}
                                    {workout.reps} reps
                                  </span>
                                </div>
                              )}
                              {workout.notes && (
                                <div className="text-pink-600 dark:text-purple-400 italic mt-2">
                                  {workout.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ),
                      )}

                      {/* Day Total */}
                      <div className="pt-3 border-t-2 border-purple-200 dark:border-purple-700">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-pink-700 dark:text-purple-300">
                            Total Time:
                          </span>
                          <span className="font-bold text-pink-900 dark:text-purple-100">
                            {selectedDayData.workouts.reduce(
                              (sum, w) => sum + w.duration,
                              0,
                            )}{" "}
                            min
                          </span>
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
                  Select a date from the calendar to view or add
                  workouts
                </p>
              )}
            </div>
          </div>

          {/* Add Workout Form */}
          {selectedDate && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Workout for{" "}
                {new Date(selectedDate).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  },
                )}
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
                      setNewWorkout({
                        ...newWorkout,
                        exerciseType: e.target.value,
                      })
                    }
                    placeholder="e.g. Push-ups, Running, Leg Day, Skipping"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700
                               bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100
                               focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={newWorkout.duration}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        duration: e.target.value,
                      })
                    }
                    placeholder="e.g., 30"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Sets */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">
                    Sets (optional)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.sets}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        sets: e.target.value,
                      })
                    }
                    placeholder="e.g., 3"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Reps */}
                <div>
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">
                    Reps (optional)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.reps}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        reps: e.target.value,
                      })
                    }
                    placeholder="e.g., 12"
                    min="1"
                    className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2 lg:col-span-2">
                  <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={newWorkout.notes}
                    onChange={(e) =>
                      setNewWorkout({
                        ...newWorkout,
                        notes: e.target.value,
                      })
                    }
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

          {/* Monthly Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">
                  {totalWorkouts}
                </span>
              </div>
              <p className="text-sm opacity-90">
                Total Workouts
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">
                  {Math.round(totalMinutes / 60)}h
                </span>
              </div>
              <p className="text-sm opacity-90">
                Total Time ({totalMinutes} min)
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-8 h-8 opacity-80" />
                <span className="text-3xl font-bold">
                  {daysWorkedOut}
                </span>
              </div>
              <p className="text-sm opacity-90">Active Days</p>
            </div>
          </div>

          {/* Workout Consistency Chart - Workout Log View */}
          {consistencyData.length > 0 && (
            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 rounded-xl p-8 border-2 border-pink-200 dark:border-purple-700/50 shadow-xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl text-pink-900 dark:text-purple-200 mb-2 flex items-center justify-center gap-3">
                  <TrendingUp className="w-7 h-7 text-purple-500" />
                  Your Workout Consistency Journey
                </h3>
                <p className="text-pink-700 dark:text-purple-400 text-sm">
                  Every workout counts! Track your progress across all months 📊
                </p>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consistencyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9333ea"
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#9333ea"
                    ticks={[0, 1]}
                    domain={[0, 1]}
                    tickFormatter={(value) => value === 1 ? "✓" : "○"}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "2px solid #ec4899",
                      borderRadius: "12px",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => [
                      value === 1 ? "✅ Worked Out!" : "😴 Rest Day",
                      "Status",
                    ]}
                    cursor={{ fill: "rgba(236, 72, 153, 0.1)" }}
                  />
                  <Bar 
                    dataKey="worked" 
                    radius={[8, 8, 0, 0]}
                  >
                    {consistencyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.worked === 1 ? "#10b981" : "#d1d5db"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {consistencyData.filter(d => d.worked === 1).length}
                    </p>
                    <p className="text-xs text-green-900 dark:text-green-100 mt-1">Workout Days 💪</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                      {consistencyData.filter(d => d.worked === 0).length}
                    </p>
                    <p className="text-xs text-gray-900 dark:text-gray-100 mt-1">Rest Days 😴</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-lg p-4 border-2 border-purple-300 dark:border-purple-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                      {consistencyData.length > 0 
                        ? Math.round((consistencyData.filter(d => d.worked === 1).length / consistencyData.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-purple-900 dark:text-purple-100 mt-1">Consistency 🎯</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-lg p-4 border-2 border-yellow-300 dark:border-yellow-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                      {consistencyData.length}
                    </p>
                    <p className="text-xs text-orange-900 dark:text-orange-100 mt-1">Total Days 📅</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 px-6 py-3 rounded-full border-2 border-pink-200 dark:border-purple-700 shadow-md">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-pink-900 dark:text-purple-100">Worked Out</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                    <span className="text-sm text-pink-900 dark:text-purple-100">Rest Day</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Analytics View */}

          <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-900/20 rounded-xl p-8 border-2 border-pink-200 dark:border-purple-700/50 shadow-xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl text-pink-900 dark:text-purple-200 mb-2 flex items-center justify-center gap-3">
                <Calendar className="w-7 h-7 text-purple-500" />
                Workout Consistency Tracker
              </h3>
              <p className="text-pink-700 dark:text-purple-400 text-sm">
                Your dedication across all months • Green = Worked Out 💪 | Gray = Rest Day
              </p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consistencyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  stroke="#9333ea"
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9333ea"
                  ticks={[0, 1]}
                  domain={[0, 1]}
                  tickFormatter={(value) => value === 1 ? "✓" : "○"}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "2px solid #ec4899",
                    borderRadius: "12px",
                    padding: "8px 12px",
                  }}
                  formatter={(value: number) => [
                    value === 1 ? "✅ Worked Out!" : "😴 Rest Day",
                    "Status",
                  ]}
                  cursor={{ fill: "rgba(236, 72, 153, 0.1)" }}
                />
                <Bar 
                  dataKey="worked" 
                  radius={[8, 8, 0, 0]}
                >
                  {consistencyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.worked === 1 ? "#10b981" : "#d1d5db"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <span className="text-green-900 dark:text-green-100 text-sm">Workout Days</span>
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {consistencyData.filter(d => d.worked === 1).length}
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40 rounded-lg p-4 border-2 border-gray-300 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-gray-100 text-sm">Rest Days</span>
                  <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {consistencyData.filter(d => d.worked === 0).length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-lg text-pink-900 dark:text-purple-200">
                <span className="font-bold text-purple-600 dark:text-purple-400">
                  {consistencyData.length > 0 
                    ? Math.round((consistencyData.filter(d => d.worked === 1).length / consistencyData.length) * 100)
                    : 0}%
                </span>
                {" "}Consistency Rate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Weekly Data */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4">
                <Clock className="w-5 h-5 inline mr-2" />
                Weekly Progress
              </h3>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Data */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4">
                <Calendar className="w-5 h-5 inline mr-2" />
                Monthly Progress
              </h3>

              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="week" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="minutes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Consistency Data */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
              <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4">
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Consistency
              </h3>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={consistencyData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="worked"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}