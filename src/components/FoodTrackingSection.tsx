import React, { useState, useEffect } from "react";
import {
  Calendar,
  IndianRupee,
  Download,
  X,
  Check,
  Coffee,
  Sun,
  Moon as MoonIcon,
  ChevronDown,
  ChevronRight,
  Loader,
  Save,
} from "lucide-react";

import { auth, db } from "../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ================= TYPES ================= */

interface MealEntry {
  mealType: "Breakfast" | "Lunch" | "Dinner";
  regular: boolean;
  extra: boolean;
  extraAmount: number;
  foodDetails: string;
  notes: string;
}

interface DayEntry {
  date: string;
  day: string;
  meals: MealEntry[];
  expanded: boolean;
}

interface MonthData {
  month: string;
  vendorName: string;
  fixedRegularAmount: number;
  dayEntries: DayEntry[];
}

/* ================= ICONS ================= */

const MEAL_ICONS = {
  Breakfast: Coffee,
  Lunch: Sun,
  Dinner: MoonIcon,
};

/* ================= COMPONENT ================= */

export function FoodTrackingSection() {
  const [userId, setUserId] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [vendorName, setVendorName] = useState("");
  const [fixedRegularAmount, setFixedRegularAmount] = useState(0);
  const [dayEntries, setDayEntries] = useState<DayEntry[]>([]);
  const [allMonthData, setAllMonthData] = useState<MonthData[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);

  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD FIREBASE ================= */

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      const ref = doc(db, "users", userId, "foodTracking", "data");
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const months = snap.data().months as MonthData[];
        setAllMonthData(months);
        const current = months.find((m) => m.month === selectedMonth);
        if (current) {
          setVendorName(current.vendorName);
          setFixedRegularAmount(current.fixedRegularAmount);
          setDayEntries(current.dayEntries);
        } else {
          setDayEntries(generateMonthEntries(selectedMonth));
        }
      } else {
        setDayEntries(generateMonthEntries(selectedMonth));
      }
    };

    loadData();
  }, [userId, selectedMonth]);

  /* ================= SAVE FIREBASE ================= */
  const saveData = async () => {
  if (!userId) return;

  setSaveStatus("saving");

  try {
    const monthData: MonthData = {
      month: selectedMonth,
      vendorName,
      fixedRegularAmount,
      dayEntries,
    };

    const updated = allMonthData.filter(
      (m) => m.month !== selectedMonth
    );
    updated.push(monthData);
    updated.sort((a, b) => b.month.localeCompare(a.month));

    setAllMonthData(updated);

    await setDoc(
      doc(db, "users", userId, "foodTracking", "data"),
      { months: updated }
    );

    setSaveStatus("saved");
  } catch (error) {
    console.error("Manual save failed:", error);
    setSaveStatus("error");
  }
};


  const saveMonth = async (updatedMonths: MonthData[]) => {
    if (!userId) return;

    setSaveStatus("saving");
    try {
      await setDoc(
        doc(db, "users", userId, "foodTracking", "data"),
        { months: updatedMonths }
      );
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  useEffect(() => {
    if (!userId || dayEntries.length === 0) return;

    const monthData: MonthData = {
      month: selectedMonth,
      vendorName,
      fixedRegularAmount,
      dayEntries,
    };

    const updated = allMonthData.filter((m) => m.month !== selectedMonth);
    updated.push(monthData);
    updated.sort((a, b) => b.month.localeCompare(a.month));

    setAllMonthData(updated);
    saveMonth(updated);
  }, [dayEntries, vendorName, fixedRegularAmount]);

  /* ================= HELPERS ================= */

  function generateMonthEntries(month: string): DayEntry[] {
    const [y, m] = month.split("-").map(Number);
    const days = new Date(y, m, 0).getDate();

    return Array.from({ length: days }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      return {
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        expanded: false,
        meals: [
          { mealType: "Breakfast", regular: true, extra: false, extraAmount: 0, foodDetails: "", notes: "" },
          { mealType: "Lunch", regular: true, extra: false, extraAmount: 0, foodDetails: "", notes: "" },
          { mealType: "Dinner", regular: true, extra: false, extraAmount: 0, foodDetails: "", notes: "" },
        ],
      };
    });
  }

  const updateMeal = (
    dayIndex: number,
    mealIndex: number,
    field: keyof MealEntry,
    value: any
  ) => {
    const updated = [...dayEntries];
    updated[dayIndex].meals[mealIndex] = {
      ...updated[dayIndex].meals[mealIndex],
      [field]: value,
      ...(field === "extra" && !value ? { extraAmount: 0, foodDetails: "" } : {}),
    };
    setDayEntries(updated);
  };
  const toggleDayExpanded = (index: number) => {
    const updated = [...dayEntries];
    updated[index].expanded = !updated[index].expanded;
    setDayEntries(updated);
  };

  const expandAll = () => {
    const updated = dayEntries.map(entry => ({ ...entry, expanded: true }));
    setDayEntries(updated);
  };

  const collapseAll = () => {
    const updated = dayEntries.map(entry => ({ ...entry, expanded: false }));
    setDayEntries(updated);
  };

  /* ================= CALENDAR ================= */

  const calendarDays = (() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const total = new Date(y, m, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  })();

  const datesWithExtra = dayEntries
    .filter((d) => d.meals.some((m) => m.extra))
    .map((d) => d.date);

  const selectedDayData = selectedDate
    ? dayEntries.find((d) => d.date === selectedDate)
    : null;
     const exportToCSV = () => {
    const rows: string[] = [
      `Food Tracking - ${selectedMonth}`,
      `Vendor: ${vendorName}`,
      `Fixed Regular Amount: ₹${fixedRegularAmount}`,
      '',
      'Date,Day,Meal Type,Regular,Extra,Extra Amount,Food Details,Notes',
    ];

    dayEntries.forEach(day => {
      day.meals.forEach(meal => {
        rows.push([
          day.date,
          day.day,
          meal.mealType,
          meal.regular ? 'Yes' : 'No',
          meal.extra ? 'Yes' : 'No',
          meal.extraAmount,
          meal.foodDetails,
          meal.notes,
        ].join(','));
      });
    });

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `food-tracking-${selectedMonth}.csv`;
    link.click();
  };

  /* ================= TOTALS ================= */

  const totalExtraFood = dayEntries.reduce(
    (s, d) => s + d.meals.reduce((m, x) => m + (x.extra ? x.extraAmount : 0), 0),
    0
  );

  const totalFoodExpense = fixedRegularAmount + totalExtraFood;

  // Calendar generation
  const generateCalendar = () => {
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const calendar: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }

    return calendar;
  };

 

  const handleDateClick = (day: number) => {
    const [year, monthNum] = selectedMonth.split('-');
    const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    // Expand the clicked day
    const dayIndex = dayEntries.findIndex(d => d.date === dateStr);
    if (dayIndex !== -1) {
      const updated = [...dayEntries];
      updated[dayIndex].expanded = true;
      setDayEntries(updated);
      
      // Scroll to the day
      setTimeout(() => {
        const element = document.getElementById(`day-${dateStr}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };



  /* ================= UI ================= */




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
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">🍽️ Meal-wise Food Tracker</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Track every meal with precision • Auto-saves as you type</p>
      </div>

      {/* Top Bar - Monthly Setup */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
        <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Monthly Setup
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Food Vendor Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Meal Provider, Tiffin Service"
              className="w-full px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Fixed Regular Food Amount (Monthly)</label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-pink-400 dark:text-purple-500" />
              <input
                type="number"
                value={fixedRegularAmount || ''}
                onChange={(e) => setFixedRegularAmount(Number(e.target.value))}
                placeholder="e.g., 3000"
                className="w-full pl-9 pr-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-pink-700 dark:text-purple-400">
          💡 Fixed amount covers all regular meals. Track only extra meals separately.
        </div>
      </div>

      {/* Calendar View & Summary */}
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
                  const hasExtra = datesWithExtra.includes(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:shadow-md ${
                        isSelected
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                          : isToday
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-600'
                          : hasExtra
                          ? 'bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-900 dark:text-orange-100 border-2 border-orange-300 dark:border-orange-700'
                          : 'bg-pink-50 dark:bg-purple-900/20 text-pink-900 dark:text-purple-100 hover:bg-pink-100 dark:hover:bg-purple-900/40'
                      }`}
                    >
                      <span className="font-medium">{day}</span>
                      {hasExtra && (
                        <span className="text-xs mt-1">🍴</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-pink-700 dark:text-purple-400">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 border border-orange-300 dark:border-orange-700"></div>
                  <span>Has Extra</span>
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

        {/* Selected Day Breakdown */}
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
              {selectedDayData.meals.map((meal, idx) => {
                const Icon = MEAL_ICONS[meal.mealType];
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-2 ${
                      meal.extra
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                        : 'bg-white dark:bg-gray-900 border-pink-200 dark:border-purple-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-pink-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-pink-900 dark:text-purple-100">
                        {meal.mealType}
                      </span>
                    </div>
                    <div className="text-xs text-pink-700 dark:text-purple-300">
                      {meal.extra ? (
                        <>
                          <div className="flex items-center gap-1 text-orange-700 dark:text-orange-300 font-medium">
                            <span>Extra:</span>
                            <span>₹{meal.extraAmount}</span>
                          </div>
                          {meal.foodDetails && (
                            <div className="text-pink-600 dark:text-purple-400 mt-1">
                              {meal.foodDetails}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">Regular</span>
                      )}
                    </div>
                    {meal.notes && (
                      <div className="text-xs text-pink-600 dark:text-purple-400 mt-2 italic">
                        Note: {meal.notes}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Day Total */}
              <div className="pt-3 border-t-2 border-purple-200 dark:border-purple-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-pink-700 dark:text-purple-300">Extra Today:</span>
                  <span className="text-lg font-bold text-pink-900 dark:text-purple-100">
                    ₹{selectedDayData.meals.reduce((sum, m) => sum + (m.extra ? m.extraAmount : 0), 0)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-pink-600 dark:text-purple-400 text-center py-8">
              Select a date from the calendar to view meal breakdown
            </p>
          )}
        </div>
      </div>

      {/* Day-wise Food Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700 flex items-center justify-between">
          <h3 className="text-lg text-pink-900 dark:text-purple-200">📋 Meal-wise Tracking Table</h3>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm bg-purple-500 dark:bg-purple-600 text-white rounded hover:bg-purple-600 dark:hover:bg-purple-700 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm bg-pink-500 dark:bg-pink-600 text-white rounded hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-purple-900/30 dark:to-pink-900/30 z-10">
              <tr className="border-b-2 border-pink-200 dark:border-purple-700">
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200 w-8"></th>
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200 w-32">Date</th>
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200 w-32">Meal Type</th>
                <th className="px-3 py-2 text-center text-pink-900 dark:text-purple-200 w-24">Regular</th>
                <th className="px-3 py-2 text-center text-pink-900 dark:text-purple-200 w-24">Extra</th>
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200 w-32">Extra Amount</th>
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200">Food Details</th>
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200">Notes</th>
              </tr>
            </thead>
            <tbody>
              {dayEntries.map((day, dayIndex) => {
                const isToday = day.date === new Date().toISOString().split('T')[0];
                const isWeekend = day.day === 'Sat' || day.day === 'Sun';
                const dayHasExtra = day.meals.some(m => m.extra);
                const dayExtraTotal = day.meals.reduce((sum, m) => sum + (m.extra ? m.extraAmount : 0), 0);

                return (
                  <React.Fragment key={day.date}>
                    {/* Date Header Row */}
                    <tr
                      id={`day-${day.date}`}
                      className={`border-b-2 border-pink-300 dark:border-purple-700 cursor-pointer hover:bg-pink-100 dark:hover:bg-purple-900/30 ${
                        isToday ? 'bg-blue-100 dark:bg-blue-900/30' : 
                        isWeekend ? 'bg-purple-100 dark:bg-purple-900/20' :
                        'bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/40 dark:to-pink-900/40'
                      }`}
                      onClick={() => toggleDayExpanded(dayIndex)}
                    >
                      <td className="px-3 py-3">
                        {day.expanded ? (
                          <ChevronDown className="w-4 h-4 text-pink-600 dark:text-purple-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-pink-600 dark:text-purple-400" />
                        )}
                      </td>
                      <td className="px-3 py-3 font-medium text-pink-900 dark:text-purple-100" colSpan={2}>
                        <div className="flex items-center gap-2">
                          <span>
                            {new Date(day.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={`text-sm ${isWeekend ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-purple-400'}`}>
                            ({day.day})
                          </span>
                          {dayHasExtra && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-200 dark:bg-orange-900/40 text-orange-900 dark:text-orange-100 rounded text-xs">
                              Extra: ₹{dayExtraTotal}
                            </span>
                          )}
                        </div>
                      </td>
                      <td colSpan={5} className="px-3 py-3 text-right text-xs text-pink-600 dark:text-purple-400">
                        Click to {day.expanded ? 'collapse' : 'expand'} meals
                      </td>
                    </tr>

                    {/* Meal Rows (shown when expanded) */}
                    {day.expanded && day.meals.map((meal, mealIndex) => {
                      const Icon = MEAL_ICONS[meal.mealType];
                      return (
                        <tr
                          key={`${day.date}-${meal.mealType}`}
                          className={`border-b border-pink-100 dark:border-purple-800/30 ${
                            meal.extra 
                              ? 'bg-orange-50 dark:bg-orange-900/10' 
                              : 'bg-white dark:bg-gray-900'
                          } hover:bg-pink-50 dark:hover:bg-purple-900/20`}
                        >
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2"></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2 text-pink-800 dark:text-purple-200">
                              <Icon className="w-4 h-4" />
                              <span>{meal.mealType}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={meal.regular}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, 'regular', e.target.checked)}
                              className="w-4 h-4 rounded border-pink-300 dark:border-purple-600 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={meal.extra}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, 'extra', e.target.checked)}
                              className="w-4 h-4 rounded border-pink-300 dark:border-purple-600 text-orange-600 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-purple-500 text-xs">₹</span>
                              <input
                                type="number"
                                value={meal.extraAmount || ''}
                                onChange={(e) => updateMeal(dayIndex, mealIndex, 'extraAmount', Number(e.target.value))}
                                disabled={!meal.extra}
                                className={`w-full pl-5 pr-2 py-1 rounded border ${
                                  meal.extra 
                                    ? 'border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100' 
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                } focus:border-orange-400 focus:outline-none`}
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={meal.foodDetails}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, 'foodDetails', e.target.value)}
                              disabled={!meal.extra}
                              className={`w-full px-2 py-1 rounded border ${
                                meal.extra 
                                  ? 'border-orange-300 dark:border-orange-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100' 
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                              } focus:border-orange-400 focus:outline-none`}
                              placeholder="e.g., Dosa, Pizza"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={meal.notes}
                              onChange={(e) => updateMeal(dayIndex, mealIndex, 'notes', e.target.value)}
                              className="w-full px-2 py-1 rounded border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
                              placeholder="Optional notes"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-pink-50 dark:bg-purple-900/20 text-xs text-pink-700 dark:text-purple-400 border-t border-pink-200 dark:border-purple-700">
          💡 Click on any date row to expand/collapse meals. Use Tab for quick navigation. Regular meals are covered under fixed monthly cost.
        </div>
      </div>

      {/* Summary Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-700/50 shadow-lg">
          <p className="text-sm text-green-700 dark:text-green-300 mb-1">Fixed Regular Food (Monthly)</p>
          <p className="text-3xl text-green-900 dark:text-green-100 font-bold">₹{fixedRegularAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">Covers all regular meals</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-700/50 shadow-lg">
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Total Extra Food</p>
          <p className="text-3xl text-orange-900 dark:text-orange-100 font-bold">₹{totalExtraFood.toLocaleString('en-IN')}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
            {dayEntries.filter(d => d.meals.some(m => m.extra)).length} days with extra
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded-xl p-6 border-2 border-purple-300 dark:border-purple-600 shadow-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Total Food Expense</p>
          <p className="text-3xl text-purple-900 dark:text-purple-100 font-bold">₹{totalFoodExpense.toLocaleString('en-IN')}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Fixed + Extra meals</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={saveData}
          className="flex-1 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg"
        >
          <Save className="w-5 h-5" />
          Save All Data
        </button>
        <button
          onClick={exportToCSV}
          className="px-6 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>
    </div>
  );
}

