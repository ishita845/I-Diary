import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  weather?: string;
}

interface DiaryCalendarProps {
  entries: DiaryEntry[];
  onDateClick: (date: string) => void;
  selectedDate?: string | null;
}

export function DiaryCalendar({ entries, onDateClick, selectedDate }: DiaryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const hasEntry = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.some(entry => entry.date === dateStr);
  };

  const getEntryCount = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.filter(entry => entry.date === dateStr).length;
  };

  const isSelected = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDate === dateStr;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onDateClick(dateStr);
  };

  // Create array for calendar grid
  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null); // Empty cells before first day
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-gradient-to-br from-white to-pink-50/30 dark:from-black dark:to-purple-950/30 rounded-2xl p-5 border-2 border-pink-200 dark:border-purple-800/50 shadow-xl max-w-lg mx-auto backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={handlePrevMonth}
          className="group p-2 rounded-xl hover:bg-pink-100 dark:hover:bg-purple-900/50 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-pink-600 dark:text-purple-400 group-hover:text-pink-700 dark:group-hover:text-purple-300 transition-colors" />
        </button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Calendar className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
            <h3 className="text-xl text-pink-900 dark:text-purple-200">
              {monthNames[month]} {year}
            </h3>
          </div>
          <button
            onClick={handleToday}
            className="text-xs text-pink-600 dark:text-purple-400 hover:underline hover:text-pink-700 dark:hover:text-purple-300 transition-all mt-1"
          >
            Jump to Today
          </button>
        </div>
        <button
          onClick={handleNextMonth}
          className="group p-2 rounded-xl hover:bg-pink-100 dark:hover:bg-purple-900/50 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-pink-600 dark:text-purple-400 group-hover:text-pink-700 dark:group-hover:text-purple-300 transition-colors" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs text-pink-700 dark:text-purple-300 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const hasEntryForDay = hasEntry(day);
          const entryCount = getEntryCount(day);
          const isSelectedDay = isSelected(day);
          const isTodayDay = isToday(day);
          const isHovered = hoveredDay === day;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`
                aspect-square rounded-xl transition-all duration-300 relative overflow-hidden
                transform hover:scale-110 active:scale-95
                ${isSelectedDay
                  ? 'bg-gradient-to-br from-pink-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 text-white shadow-2xl scale-110 ring-4 ring-pink-200 dark:ring-purple-500/50'
                  : isTodayDay
                  ? 'bg-gradient-to-br from-pink-200 to-purple-200 dark:from-purple-900/70 dark:to-purple-800/70 text-pink-900 dark:text-purple-100 ring-2 ring-pink-400 dark:ring-purple-600 shadow-lg'
                  : hasEntryForDay
                  ? 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-purple-900/50 text-purple-900 dark:text-purple-200 hover:shadow-lg hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-700'
                  : 'bg-pink-50/50 dark:bg-purple-950/20 text-pink-900 dark:text-purple-300 hover:bg-pink-100 dark:hover:bg-purple-900/30 hover:shadow-md'
                }
              `}
            >
              <span className={`text-sm ${isSelectedDay ? 'font-bold' : ''}`}>{day}</span>
              
              {/* Entry indicator dots */}
              {hasEntryForDay && !isSelectedDay && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(entryCount, 3) }).map((_, i) => (
                    <div 
                      key={i}
                      className={`w-1 h-1 rounded-full animate-pulse ${
                        isTodayDay 
                          ? 'bg-pink-600 dark:bg-purple-400' 
                          : 'bg-purple-500 dark:bg-purple-400'
                      }`}
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* Hover tooltip */}
              {isHovered && hasEntryForDay && !isSelectedDay && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-purple-900 dark:bg-purple-700 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-900 dark:border-t-purple-700" />
                </div>
              )}

              {/* Sparkle effect for selected day */}
              {isSelectedDay && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full animate-ping" />
                  <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 pt-4 border-t-2 border-pink-200 dark:border-purple-800/50 flex flex-wrap gap-3 text-xs text-pink-700 dark:text-purple-400">
        <div className="flex items-center gap-1.5 group cursor-default">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 dark:from-purple-900/70 dark:to-purple-800/70 ring-2 ring-pink-400 dark:ring-purple-600 group-hover:scale-110 transition-transform" />
          <span className="group-hover:text-pink-800 dark:group-hover:text-purple-300 transition-colors">Today</span>
        </div>
        <div className="flex items-center gap-1.5 group cursor-default">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/50 dark:to-purple-900/50 relative group-hover:scale-110 transition-transform">
            <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full" />
          </div>
          <span className="group-hover:text-pink-800 dark:group-hover:text-purple-300 transition-colors">Has entries</span>
        </div>
        <div className="flex items-center gap-1.5 group cursor-default">
          <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-pink-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 shadow-lg group-hover:scale-110 transition-transform" />
          <span className="group-hover:text-pink-800 dark:group-hover:text-purple-300 transition-colors">Selected</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t-2 border-pink-200 dark:border-purple-800/50">
        <div className="flex justify-around text-center">
          <div className="group">
            <p className="text-2xl text-pink-600 dark:text-purple-400 group-hover:scale-110 transition-transform inline-block">
              {entries.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length}
            </p>
            <p className="text-xs text-pink-700 dark:text-purple-300 mt-1">This Month</p>
          </div>
          <div className="group">
            <p className="text-2xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform inline-block">
              {entries.length}
            </p>
            <p className="text-xs text-pink-700 dark:text-purple-300 mt-1">Total Entries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
