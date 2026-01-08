import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { DailyEntries } from './components/DailyEntries';
import { ShowsSection } from './components/ShowsSection';
import { PeopleSection } from './components/PeopleSection';
import { FavoritesSection } from './components/FavoritesSection';
import { FutureLettersSection } from './components/FutureLettersSection';
import { FreePagesSection } from './components/FreePagesSection';
import { ExpensesSection } from './components/ExpensesSection';
import { FoodTrackingSection } from './components/FoodTrackingSection';
import { FutureWishlistSection } from './components/FutureWishlistSection';
import { ExerciseTracking } from './components/ExerciseTracking';
import { GoalsListsSection } from './components/GoalsListsSection';
import { BookOpen, Sparkles, LogOut, Moon, Sun, Home } from 'lucide-react';

import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
  return localStorage.getItem('activeTab') || 'home';
});

  const [loading, setLoading] = useState(true);
  const [savedDate, setSavedDate] = useState<string | null>(null);

  /* 🔐 FIREBASE AUTH ONLY (NO localStorage) */
  useEffect(() => {
  if (activeTab) {
    localStorage.setItem('activeTab', activeTab);
  }
}, [activeTab]);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setCurrentUser(null);
      setActiveTab('home'); // only when logged out
      setLoading(false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().username) {
        setCurrentUser(snap.data().username);
      } else if (user.email) {
        setCurrentUser(user.email);
      } else if (user.phoneNumber) {
        setCurrentUser(user.phoneNumber);
      } else {
        setCurrentUser('User');
      }
    } catch {
      setCurrentUser(user.email || 'User');
    }

    // ✅ DO NOT touch activeTab here
    setLoading(false);
  });

  return () => unsubscribe();
}, []);


 const handleLogin = (username: string) => {
  setCurrentUser(username);

  // only set home if nothing exists yet
  const savedTab = localStorage.getItem('activeTab');
  if (!savedTab) {
    setActiveTab('home');
  }
};


const handleLogout = async () => {
  if (confirm('Are you sure you want to logout? Your diary will be saved.')) {
    await signOut(auth);
    setCurrentUser(null);
    setActiveTab('home');
    localStorage.removeItem('activeTab');
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-500">
        Loading your diary...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const tabs = [
    { id: 'daily', label: '📖 Daily Diary', component: DailyEntries },
    { id: 'goals', label: '🎯 Goals Lists', component: GoalsListsSection },
    { id: 'expenses', label: '💰 Expenses', component: ExpensesSection },
    { id: 'food', label: '🍽️ Food Tracking', component: FoodTrackingSection },
    { id: 'exercise', label: '💪 Exercise Tracker', component: ExerciseTracking },
     { id: 'free', label: '✍️ Free Pages', component: FreePagesSection },
    { id: 'shows', label: '🎭 Shows & Dramas', component: ShowsSection },
    { id: 'people', label: '💞 People to Meet', component: PeopleSection },
    { id: 'wishlist', label: '✨ Future Wishlist', component: FutureWishlistSection },
    { id: 'favorites', label: '💖 Favorites', component: FavoritesSection },
    { id: 'future', label: '💌 Future Letters', component: FutureLettersSection },
   
    
  ];

  const ActiveComponent =
    tabs.find(tab => tab.id === activeTab)?.component || Dashboard;
     const handleSelectSection = (sectionId: string) => {
    setActiveTab(sectionId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-black dark:via-purple-950 dark:to-black transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-black/80 backdrop-blur-sm border-b border-pink-200 dark:border-purple-900/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-pink-400 to-purple-500 dark:from-purple-500 dark:to-purple-700 p-2 rounded-xl shadow-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl text-pink-900 dark:text-purple-200 flex items-center gap-2">
                  {currentUser}'s Memory Diary
                  <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
                </h1>
                {savedDate && (
                  <p className="text-xs text-pink-600 dark:text-purple-400">Last saved: {savedDate}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('home')}
                className="relative p-2 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 text-pink-900 dark:text-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-110 group"
                aria-label="Go to Home"
              >
                <Home className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 text-pink-900 dark:text-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-110 group overflow-hidden"
                aria-label="Toggle theme"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-purple-600 dark:to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icons with rotation animation */}
                <div className="relative z-10">
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300" />
                  ) : (
                    <Sun className="w-5 h-5 transform group-hover:rotate-180 transition-transform duration-500" />
                  )}
                </div>
                
                {/* Sparkle effect */}
                <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 dark:bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-100 dark:bg-purple-900/50 text-pink-900 dark:text-purple-200 hover:bg-pink-200 dark:hover:bg-purple-800/70 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/60 dark:bg-black/60 backdrop-blur-sm border-b border-pink-200 dark:border-purple-900/50 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 scrollbar-thin">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleSelectSection(tab.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 text-white shadow-lg scale-105'
                    : 'bg-white/50 dark:bg-purple-950/30 text-pink-900 dark:text-purple-200 hover:bg-pink-100 dark:hover:bg-purple-900/40 hover:scale-105'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200 dark:border-purple-900/50 p-6 md:p-8 transition-colors duration-300">
          {activeTab === 'home' ? (
            <Dashboard onSelectSection={handleSelectSection} />
          ) : (
            <ActiveComponent />
          )}
        </div>
      </main>

      {/* Footer Tip */}
      <footer className="max-w-6xl mx-auto px-4 py-6 text-center text-pink-700 dark:text-purple-400 text-sm">
        <p className="italic">
          💡 This diary is for your soul, not perfection. Write freely and honestly.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}