import { 
  BookOpen, 
  Tv, 
  Users, 
  Sparkles, 
  Heart, 
  Mail, 
  FileText, 
  Dumbbell, 
  UtensilsCrossed, 
  IndianRupee,
  CheckSquare 
} from 'lucide-react';

interface DashboardProps {
  onSelectSection: (sectionId: string) => void;
}

export function Dashboard({ onSelectSection }: DashboardProps) {
  const sections = [
    {
      id: 'daily',
      title: 'Daily Diary',
      emoji: '📖',
      icon: BookOpen,
      description: 'Record your daily thoughts, feelings, and memories',
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-200 dark:border-pink-800',
    },
     {
      id: 'goals',
      title: 'Goals & Lists',
      emoji: '🎯',
      icon: CheckSquare,
      description: 'Create custom to-do lists for any goal or activity',
      color: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
       {
      id: 'expenses',
      title: 'Monthly Expenses',
      emoji: '💰',
      icon: IndianRupee,
      description: 'Track your expenses and manage budget (INR)',
      color: 'from-emerald-400 to-green-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
       {
      id: 'food',
      title: 'Food Tracking',
      emoji: '🍽️',
      icon: UtensilsCrossed,
      description: 'Log your meals and food experiences',
      color: 'from-orange-400 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
       {
      id: 'exercise',
      title: 'Exercise Tracker',
      emoji: '💪',
      icon: Dumbbell,
      description: 'Track your workouts and fitness journey',
      color: 'from-green-400 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    },
      {
      id: 'free',
      title: 'Free Pages',
      emoji: '✍️',
      icon: FileText,
      description: 'Blank pages for free-form journaling',
      color: 'from-teal-400 to-cyan-500',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      borderColor: 'border-teal-200 dark:border-teal-800',
    },
    {
      id: 'shows',
      title: 'Shows & Dramas',
      emoji: '🎭',
      icon: Tv,
      description: 'Track shows you\'ve watched, favorites, and want to watch',
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800',
    },
    {
      id: 'people',
      title: 'People to Meet',
      emoji: '💞',
      icon: Users,
      description: 'Dream list of people you\'d love to meet someday',
      color: 'from-rose-400 to-pink-500',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800',
    },
    {
      id: 'wishlist',
      title: 'Future Wishlist',
      emoji: '✨',
      icon: Sparkles,
      description: 'Items and experiences you wish for in the future',
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    {
      id: 'favorites',
      title: 'Favorites',
      emoji: '💖',
      icon: Heart,
      description: 'Collection of your favorite things across categories',
      color: 'from-red-400 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
    },
    {
      id: 'future',
      title: 'Future Letters',
      emoji: '💌',
      icon: Mail,
      description: 'Write letters to your future self',
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      borderColor: 'border-indigo-200 dark:border-indigo-800',
    },
  
 
 

  
  ];

  return (
    <div className="space-y-8 relative">
      {/* Doodle Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        {/* Stars */}
        <div className="absolute top-10 left-10 text-4xl">⭐</div>
        <div className="absolute top-32 right-20 text-3xl">✨</div>
        <div className="absolute bottom-40 left-32 text-5xl">💫</div>
        <div className="absolute top-64 right-40 text-4xl">🌟</div>
        
        {/* Hearts */}
        <div className="absolute top-48 left-1/4 text-4xl">💖</div>
        <div className="absolute bottom-64 right-1/3 text-3xl">💕</div>
        <div className="absolute top-96 right-10 text-4xl">💗</div>
        
        {/* Flowers */}
        <div className="absolute bottom-20 left-20 text-5xl">🌸</div>
        <div className="absolute top-20 right-64 text-4xl">🌺</div>
        <div className="absolute bottom-96 right-20 text-3xl">🌼</div>
        
        {/* Other doodles */}
        <div className="absolute top-80 left-40 text-4xl">🦋</div>
        <div className="absolute bottom-32 right-48 text-3xl">🎨</div>
        <div className="absolute top-40 left-2/3 text-4xl">☁️</div>
        <div className="absolute bottom-72 left-1/2 text-3xl">🎀</div>
      </div>

      {/* Welcome Header */}
      <div className="text-center relative z-10">
        <h1 className="text-4xl text-pink-900 dark:text-pink-200 mb-2">
          Welcome to Your Memory Diary
        </h1>
        <p className="text-lg text-pink-700 dark:text-pink-400 max-w-2xl mx-auto">
          Choose a section to start writing your story. Each page is a new chapter in your journey. ✨
        </p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(section.id)}
              className={`group relative ${section.bgColor} border-2 ${section.borderColor} rounded-xl p-4 text-left hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon and Emoji */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`bg-gradient-to-br ${section.color} p-2 rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">
                    {section.emoji}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-pink-900 dark:text-pink-200 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {section.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-pink-700 dark:text-pink-400 leading-relaxed line-clamp-2">
                  {section.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-2 flex items-center gap-1 text-purple-500 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                  <span className="text-xs font-medium">Open</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}