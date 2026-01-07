import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { LoginPage } from "./components/LoginPage";
import { DailyEntries } from "./components/DailyEntries";
import { ShowsSection } from "./components/ShowsSection";
import { PeopleSection } from "./components/PeopleSection";
import { FavoritesSection } from "./components/FavoritesSection";
import { FutureLettersSection } from "./components/FutureLettersSection";
import { FreePagesSection } from "./components/FreePagesSection";
import { ExpensesSection } from "./components/ExpensesSection";
import { FoodTrackingSection } from "./components/FoodTrackingSection";
import { FutureWishlistSection } from "./components/FutureWishlistSection";
import { ExerciseTracking } from "./components/ExerciseTracking";
import { BookOpen, Sparkles, LogOut, Moon, Sun } from "lucide-react";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./config/firebase";
import { doc, getDoc } from "firebase/firestore";

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedDate, setSavedDate] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<string>("daily");

useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  localStorage.setItem(`activeTab_${user.uid}`, activeTab);
}, [activeTab]);

  /* 🔐 FIREBASE AUTH PERSISTENCE */

      // ✅ RESTORE LAST OPEN TAB HERE (THIS IS THE FIX)
    
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setCurrentUser(null);
      setActiveTab("daily");
      setLoading(false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, "users", user.uid));

      if (snap.exists() && snap.data().username) {
        // ✅ ALWAYS USE SAVED USERNAME
        setCurrentUser(snap.data().username);
      } else if (user.phoneNumber) {
        setCurrentUser(user.phoneNumber);
      } else if (user.email) {
        setCurrentUser(user.email);
      } else {
        setCurrentUser(user.uid);
      }

      // ✅ Restore last opened tab for THIS user
      const savedTab = localStorage.getItem(`activeTab_${user.uid}`);
      if (savedTab) {
        setActiveTab(savedTab);
      }
    } catch (e) {
      console.error("Failed to load username", e);
      setCurrentUser(user.email || user.uid);
    }

    setLoading(false);
  });

  return () => unsubscribe();
}, []);

  

  /* OPTIONAL: last saved timestamp later */
  useEffect(() => {
    if (currentUser) {
      // you can fetch last saved date here later
    }
  }, [currentUser]);

  const handleLogin = (username: string) => {
    // keeps UI smooth (Firebase still controls real auth)
    setCurrentUser(username);
  };

const handleLogout = async () => {
  if (confirm("Are you sure you want to logout? Your diary will be saved.")) {
    const user = auth.currentUser;
    if (user) {
      localStorage.removeItem(`activeTab_${user.uid}`);
    }
    await signOut(auth);
    setCurrentUser(null);
  }
};


  /* ⏳ LOADING SCREEN (prevents flash) */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-500">
        Loading your diary...
      </div>
    );
  }

  /* 🔑 LOGIN */
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const tabs = [
    { id: "daily", label: "📖 Daily Diary", component: DailyEntries },
    { id: "shows", label: "🎭 Shows & Dramas", component: ShowsSection },
    { id: "people", label: "💞 People to Meet", component: PeopleSection },
    { id: "wishlist", label: "✨ Future Wishlist", component: FutureWishlistSection },
    { id: "favorites", label: "💖 Favorites", component: FavoritesSection },
    { id: "future", label: "💌 Future Letters", component: FutureLettersSection },
    { id: "free", label: "✍️ Free Pages", component: FreePagesSection },
    { id: "exercise", label: "💪 Exercise Tracker", component: ExerciseTracking },
    { id: "food", label: "🍽️ Food Tracking", component: FoodTrackingSection },
    { id: "expenses", label: "💰 Expenses", component: ExpensesSection },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || DailyEntries;

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
                  <p className="text-xs text-pink-600 dark:text-purple-400">
                    Last saved: {savedDate}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 text-pink-900 dark:text-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-110 group overflow-hidden"
              >
                <div className="relative z-10">
                  {theme === "light" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </div>
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

      {/* Tabs */}
      <nav className="bg-white/60 dark:bg-black/60 backdrop-blur-sm border-b border-pink-200 dark:border-purple-900/50 sticky top-[73px] z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-pink-400 to-purple-500 dark:from-purple-600 dark:to-purple-800 text-white shadow-lg scale-105"
                    : "bg-white/50 dark:bg-purple-950/30 text-pink-900 dark:text-purple-200 hover:scale-105"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white/70 dark:bg-black/70 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200 dark:border-purple-900/50 p-6 md:p-8">
          <ActiveComponent />
        </div>
      </main>

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
