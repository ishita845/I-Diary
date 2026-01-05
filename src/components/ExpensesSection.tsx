import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  IndianRupee,
  Download,
  Save,
  Trash2,
  X,
  TrendingUp,
  PieChart as PieChartIcon,
  Check,
  Loader,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

/* ================= TYPES ================= */

interface ExpenseEntry {
  id: string;
  date: string;
  category:
    | "Food"
    | "Transport"
    | "Shopping"
    | "Entertainment"
    | "Bills"
    | "Other";
  amount: number;
  description: string;
}

interface MonthData {
  month: string;
  expenses: ExpenseEntry[];
}

/* ================= CONSTANTS ================= */

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Other",
] as const;

const CATEGORY_COLORS = {
  Food: "#FF6B9D",
  Transport: "#C084FC",
  Shopping: "#60A5FA",
  Entertainment: "#F59E0B",
  Bills: "#10B981",
  Other: "#6B7280",
};

const DARK_COLORS = {
  Food: "#b794f6",
  Transport: "#9d7ee8",
  Shopping: "#8b69d9",
  Entertainment: "#d97706",
  Bills: "#059669",
  Other: "#4b5563",
};

/* ================= COMPONENT ================= */

export function ExpensesSection() {
  const userId = auth.currentUser?.uid;

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );
  const [allMonthData, setAllMonthData] = useState<MonthData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);

  const [newEntry, setNewEntry] = useState<Partial<ExpenseEntry>>({
    category: "Food",
    amount: 0,
    description: "",
  });

  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const snap = await getDoc(
        doc(db, "users", userId, "expenses", "data")
      );
      if (snap.exists()) {
        setAllMonthData(snap.data().months || []);
      }
    };

    load();
  }, [userId]);

  useEffect(() => {
    const month = allMonthData.find((m) => m.month === selectedMonth);
    setExpenses(month ? month.expenses : []);
  }, [selectedMonth, allMonthData]);

  /* ================= SAVE ================= */

  const persist = async (months: MonthData[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, "users", userId, "expenses", "data"),
      { months },
      { merge: true }
    );
  };

  const autoSave = async () => {
    try {
      setSaveStatus("saving");

      const updated: MonthData[] = [
        ...allMonthData.filter((m) => m.month !== selectedMonth),
        { month: selectedMonth, expenses },
      ].sort((a, b) => b.month.localeCompare(a.month));

      setAllMonthData(updated);
      await persist(updated);

      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  useEffect(() => {
    if (expenses.length) autoSave();
  }, [expenses]);

  const saveData = async () => {
    await autoSave();
    alert("✅ All data saved successfully!");
  };

  /* ================= EXPENSE CRUD ================= */

  const addExpense = () => {
    if (!selectedDate || !newEntry.amount || newEntry.amount <= 0) return;

    const expense: ExpenseEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      category: newEntry.category as any,
      amount: newEntry.amount,
      description: newEntry.description || "",
    };

    setExpenses([...expenses, expense]);
    setNewEntry({ category: "Food", amount: 0, description: "" });
  };

  const deleteExpense = (id: string) => {
    if (confirm("Delete this expense?")) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };
   const generateMonthDays = (): string[] => {
    const [year, monthNum] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const days: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      days.push(date.toISOString().split('T')[0]);
    }

    return days;
  };
  
    const monthDays = generateMonthDays();
    const categoryTotals = CATEGORIES.reduce(
  (acc, c) => ({
    ...acc,
    [c]: expenses
      .filter((e) => e.category === c)
      .reduce((s, e) => s + e.amount, 0),
  }),
  {} as Record<string, number>
);

const grandTotal = Object.values(categoryTotals).reduce(
  (a, b) => a + b,
  0
);


  /* ================= HELPERS ================= */

  const getDayTotals = (date: string) => {
    const totals: Record<string, number> = {};
    CATEGORIES.forEach(
      (c) =>
        (totals[c] = expenses
          .filter((e) => e.date === date && e.category === c)
          .reduce((s, e) => s + e.amount, 0))
    );
    totals["Total"] = Object.values(totals).reduce((a, b) => a + b, 0);
    return totals;
  };

 
  /* ================= CALENDAR ================= */

  const generateCalendar = () => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  };

  const calendarDays = generateCalendar();

  const openDayModal = (date: string) => {
    setSelectedDate(date);
    setShowDayModal(true);
  };

  const closeDayModal = () => {
    setShowDayModal(false);
    setSelectedDate(null);
  };
    // Chart data
  const chartData = CATEGORIES.map(cat => ({
    name: cat,
    value: categoryTotals[cat] || 0,
  })).filter(d => d.value > 0);
    // Get expenses for selected date
  const selectedDayExpenses = selectedDate 
    ? expenses.filter(e => e.date === selectedDate).sort((a, b) => b.id.localeCompare(a.id))
    : [];

  const handleCalendarDateClick = (day: number) => {
    const [year, monthNum] = selectedMonth.split('-');
    const dateStr = `${year}-${monthNum}-${String(day).padStart(2, '0')}`;
    openDayModal(dateStr);
  };
    const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExpense();
    }
  };
 const exportToCSV = () => {
    const rows = [
      'Date,Category,Amount,Description',
      ...expenses.map(e => `${e.date},${e.category},${e.amount},${e.description}`),
    ];
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${selectedMonth}.csv`;
    link.click();
  };
    const isDarkMode = document.documentElement.classList.contains('dark');

  /* ================= UI ================= */




  /* ================= UI (UNCHANGED) ================= */



  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">💰 Day-wise Expense Tracker</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Excel-style daily overview with quick entry</p>
      </div>

      {/* Month Selector & Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            <div>
              <label className="block text-pink-800 dark:text-purple-300 mb-2 text-sm">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-pink-700 dark:text-purple-300 mb-1">Monthly Total</p>
            <p className="text-3xl text-pink-900 dark:text-purple-100 font-bold">₹{grandTotal.toLocaleString('en-IN')}</p>
            <p className="text-xs text-pink-600 dark:text-purple-400">{expenses.length} entries</p>
          </div>
        </div>

        {/* Category Totals */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-pink-200 dark:border-purple-700">
          {CATEGORIES.map(cat => (
            <div key={cat} className="text-center p-3 bg-pink-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-xs text-pink-700 dark:text-purple-300 mb-1">{cat}</p>
              <p className="text-lg text-pink-900 dark:text-purple-100 font-medium">
                ₹{(categoryTotals[cat] || 0).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Calendar View */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
        <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Monthly Calendar - Click to Add/View Expenses
        </h3>

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
            const dayTotal = getDayTotals(dateStr).Total;
            const hasExpenses = dayTotal > 0;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={day}
                onClick={() => handleCalendarDateClick(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:shadow-md ${
                  isToday
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 border-2 border-blue-400 dark:border-blue-600'
                    : hasExpenses
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 text-red-900 dark:text-red-100 border-2 border-red-300 dark:border-red-700'
                    : 'bg-pink-50 dark:bg-purple-900/20 text-pink-900 dark:text-purple-100 hover:bg-pink-100 dark:hover:bg-purple-900/40'
                }`}
              >
                <span className="font-medium">{day}</span>
                {hasExpenses && (
                  <span className="text-xs mt-1">₹{dayTotal}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-pink-700 dark:text-purple-400">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 border border-red-300 dark:border-red-700"></div>
            <span>Has Expenses</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-400 dark:border-blue-600"></div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Day-wise Expense Table (Excel-style Summary) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700">
          <h3 className="text-lg text-pink-900 dark:text-purple-200">📊 Day-wise Summary Table</h3>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-purple-900/30 dark:to-pink-900/30 z-10">
              <tr className="border-b-2 border-pink-200 dark:border-purple-700">
                <th className="px-3 py-2 text-left text-pink-900 dark:text-purple-200 w-32 sticky left-0 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-purple-900/30 dark:to-pink-900/30">
                  Date
                </th>
                {CATEGORIES.map(cat => (
                  <th key={cat} className="px-3 py-2 text-right text-pink-900 dark:text-purple-200 w-24">
                    {cat}
                  </th>
                ))}
                <th className="px-3 py-2 text-right text-pink-900 dark:text-purple-200 w-28 font-bold">
                  Total
                </th>
                <th className="px-3 py-2 text-center text-pink-900 dark:text-purple-200 w-16">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {monthDays.map((date, index) => {
                const totals = getDayTotals(date);
                const hasExpenses = totals.Total > 0;
                const isToday = date === new Date().toISOString().split('T')[0];
                const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                const isWeekend = dayName === 'Sat' || dayName === 'Sun';

                return (
                  <tr
                    key={date}
                    className={`border-b border-pink-100 dark:border-purple-800/30 hover:bg-pink-50 dark:hover:bg-purple-900/20 transition-colors ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20' :
                      isWeekend ? 'bg-purple-50/30 dark:bg-purple-900/10' :
                      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-pink-50/30 dark:bg-purple-900/10'
                    }`}
                  >
                    <td className={`px-3 py-2 sticky left-0 ${
                      isToday ? 'bg-blue-50 dark:bg-blue-900/20' :
                      isWeekend ? 'bg-purple-50/30 dark:bg-purple-900/10' :
                      index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-pink-50/30 dark:bg-purple-900/10'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-pink-900 dark:text-purple-100">
                          {new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className={`text-xs ${isWeekend ? 'text-purple-600 dark:text-purple-400' : 'text-pink-600 dark:text-purple-400'}`}>
                          ({dayName})
                        </span>
                      </div>
                    </td>
                    {CATEGORIES.map(cat => (
                      <td key={cat} className={`px-3 py-2 text-right ${
                        totals[cat] > 0 ? 'text-pink-900 dark:text-purple-100 font-medium' : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {totals[cat] > 0 ? `₹${totals[cat].toLocaleString('en-IN')}` : '-'}
                      </td>
                    ))}
                    <td className={`px-3 py-2 text-right font-bold ${
                      hasExpenses ? 'text-pink-900 dark:text-purple-100' : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {hasExpenses ? `₹${totals.Total.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => openDayModal(date)}
                        className="p-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm hover:shadow-md"
                        title="Add/View expenses"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {/* Total Row */}
              <tr className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 font-bold border-t-2 border-pink-300 dark:border-purple-600 sticky bottom-0">
                <td className="px-3 py-3 text-pink-900 dark:text-purple-100 sticky left-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40">
                  MONTHLY TOTAL
                </td>
                {CATEGORIES.map(cat => (
                  <td key={cat} className="px-3 py-3 text-right text-pink-900 dark:text-purple-100">
                    ₹{(categoryTotals[cat] || 0).toLocaleString('en-IN')}
                  </td>
                ))}
                <td className="px-3 py-3 text-right text-pink-900 dark:text-purple-100 text-lg">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </td>
                <td className="px-3 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-pink-50 dark:bg-purple-900/20 text-xs text-pink-700 dark:text-purple-400 border-t border-pink-200 dark:border-purple-700">
          💡 Click the <Plus className="w-3 h-3 inline" /> button on any day to add or view expenses for that date.
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
            <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Category Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString('en-IN')}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isDarkMode ? DARK_COLORS[entry.name as keyof typeof DARK_COLORS] : CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border-2 border-pink-200 dark:border-purple-700/50 shadow-lg">
            <h3 className="text-lg text-pink-900 dark:text-purple-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Category Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill={isDarkMode ? '#b794f6' : '#C084FC'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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

      {/* Day Expense Detail Modal */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-2xl border-2 border-pink-200 dark:border-purple-700 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl text-pink-900 dark:text-purple-200 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    {new Date(selectedDate).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric',
                      weekday: 'long'
                    })}
                  </h3>
                  <p className="text-sm text-pink-700 dark:text-purple-400 mt-1">
                    {selectedDayExpenses.length} expense(s) • Total: ₹{getDayTotals(selectedDate).Total.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={closeDayModal}
                  className="p-2 rounded-full hover:bg-pink-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <X className="w-6 h-6 text-pink-900 dark:text-purple-200" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Add New Expense Form */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700/50">
                <h4 className="text-lg text-green-900 dark:text-green-100 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Expense
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-green-800 dark:text-green-300 mb-1 text-sm">Category</label>
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border-2 border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-green-400 focus:outline-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-green-800 dark:text-green-300 mb-1 text-sm">Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-400 dark:text-green-500" />
                      <input
                        type="number"
                        value={newEntry.amount || ''}
                        onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-green-400 focus:outline-none"
                        onKeyPress={handleKeyPress}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-green-800 dark:text-green-300 mb-1 text-sm">Description (optional)</label>
                    <input
                      type="text"
                      value={newEntry.description || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="e.g., Lunch at cafe"
                      className="w-full px-3 py-2 rounded-lg border-2 border-green-200 dark:border-green-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 focus:border-green-400 focus:outline-none"
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                </div>

                <button
                  onClick={addExpense}
                  className="w-full mt-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              </div>

              {/* Existing Expenses List */}
              <div>
                <h4 className="text-lg text-pink-900 dark:text-purple-200 mb-3">Expenses for this day</h4>
                
                {selectedDayExpenses.length === 0 ? (
                  <p className="text-center py-8 text-pink-600 dark:text-purple-400">
                    No expenses recorded for this day yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 bg-pink-50 dark:bg-purple-900/20 rounded-lg border border-pink-200 dark:border-purple-700/50 hover:shadow-md transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full text-xs">
                              {expense.category}
                            </span>
                            <span className="text-xl text-pink-900 dark:text-purple-100 font-bold">
                              ₹{expense.amount.toLocaleString('en-IN')}
                            </span>
                          </div>
                          {expense.description && (
                            <p className="text-sm text-pink-700 dark:text-purple-400 ml-1">
                              {expense.description}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteExpense(expense.id)}
                          className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Breakdown for this day */}
              {selectedDayExpenses.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-700/50">
                  <h4 className="text-lg text-purple-900 dark:text-purple-100 mb-3">Category Breakdown</h4>
                  <div className="space-y-2">
                    {CATEGORIES.map(cat => {
                      const catTotal = selectedDayExpenses
                        .filter(e => e.category === cat)
                        .reduce((sum, e) => sum + e.amount, 0);
                      
                      if (catTotal === 0) return null;

                      return (
                        <div key={cat} className="flex justify-between items-center p-2 bg-white dark:bg-gray-900 rounded">
                          <span className="text-pink-800 dark:text-purple-200">{cat}</span>
                          <span className="text-pink-900 dark:text-purple-100 font-medium">
                            ₹{catTotal.toLocaleString('en-IN')}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 rounded font-bold border-t-2 border-purple-300 dark:border-purple-600 mt-2">
                      <span className="text-purple-900 dark:text-purple-100">Total</span>
                      <span className="text-purple-900 dark:text-purple-100 text-lg">
                        ₹{getDayTotals(selectedDate).Total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-pink-50 dark:bg-purple-900/20 border-t-2 border-pink-200 dark:border-purple-700 flex justify-end">
              <button
                onClick={closeDayModal}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Auto-save Status Indicator */}
      <div className="fixed top-20 right-4 z-50 animate-in fade-in duration-200">
        {saveStatus === 'saving' && (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">Saving...</span>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">Saved!</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <X className="w-4 h-4" />
            <span className="text-sm">Error saving</span>
          </div>
        )}
      </div>
    </div>
  );
}