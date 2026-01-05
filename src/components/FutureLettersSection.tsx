import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Mail,
  X,
  Edit3,
  Heart,
  Loader,
  Check,
  Send,
  Save,
} from "lucide-react";

import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

/* ================= TYPES ================= */

interface Letter {
  id: string;
  recipientName: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

/* ================= COMPONENT ================= */

export function FutureLettersSection() {
  const userId = auth.currentUser?.uid || null;
  const currentUser = auth.currentUser?.email || "You";


  const [letters, setLetters] = useState<Letter[]>([]);
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null);
  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  /* ================= LOAD FROM FIREBASE ================= */

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", userId, "futureLetters", "data")
        );
        if (snap.exists()) {
          setLetters(snap.data().letters || []);
        }
      } catch (e) {
        console.error("Load failed", e);
      }
    };

    load();
  }, [userId]);

  /* ================= SAVE TO FIREBASE ================= */

  const persist = async (updated: Letter[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, "users", userId, "futureLetters", "data"),
      { letters: updated },
      { merge: true }
    );
  };

  /* ================= AUTO SAVE ================= */

  useEffect(() => {
    if (!currentLetter) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        const updated = letters.some((l) => l.id === currentLetter.id)
          ? letters.map((l) =>
              l.id === currentLetter.id
                ? { ...currentLetter, updatedAt: new Date().toISOString() }
                : l
            )
          : [
              { ...currentLetter, updatedAt: new Date().toISOString() },
              ...letters,
            ];

        setLetters(updated);
        await persist(updated);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentLetter]);

  /* ================= ACTIONS ================= */
  const autoSave = () => {
  if (!currentLetter) return;

  // just trigger state update so useEffect runs
  setCurrentLetter({ ...currentLetter });
};
  const handleRecipientChange = (value: string) => {
    if (currentLetter) {
      setCurrentLetter({ ...currentLetter, recipientName: value });
    }
  };

  const handleMessageChange = (value: string) => {
    if (currentLetter) {
      setCurrentLetter({ ...currentLetter, message: value });
    }
  };

  const createNewLetter = () => {
    setCurrentLetter({
      id: Date.now().toString(),
      recipientName: "",
      message: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const openLetter = (letter: Letter) => {
    setCurrentLetter(letter);
  };

  const closeLetter = () => {
    setCurrentLetter(null);
  };

  const deleteLetter = async (id: string) => {
    if (!confirm("Delete this letter?")) return;
    const updated = letters.filter((l) => l.id !== id);
    setLetters(updated);
    await persist(updated);
    if (currentLetter?.id === id) setCurrentLetter(null);
  };

  const handleManualSave = async () => {
    if (!currentLetter) return;

    try {
      setSaveStatus("saving");

      const updated = letters.some((l) => l.id === currentLetter.id)
        ? letters.map((l) =>
            l.id === currentLetter.id
              ? { ...currentLetter, updatedAt: new Date().toISOString() }
              : l
          )
        : [
            { ...currentLetter, updatedAt: new Date().toISOString() },
            ...letters,
          ];

      setLetters(updated);
      await persist(updated);

      setSaveStatus("saved");

      // ✅ CLOSE AFTER SAVE
      setTimeout(() => setCurrentLetter(null), 200);
    } catch {
      setSaveStatus("error");
    }
  };

  /* ================= UI (UNCHANGED) ================= */




  return (
    <div className="min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">💌 Future Letters</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Write heartfelt messages to people who matter</p>
      </div>

      {!currentLetter ? (
        // Letters List View
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-6 border-2 border-pink-300 dark:border-purple-700">
            <p className="text-pink-900 dark:text-purple-200 text-center italic mb-4">
              💖 Write letters to future you, loved ones, friends, or anyone who inspires you...
            </p>
            <button
              onClick={createNewLetter}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Write New Letter
            </button>
          </div>

          {letters.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border-2 border-pink-200 dark:border-purple-700/50 text-center">
              <Mail className="w-16 h-16 text-pink-300 dark:text-purple-600 mx-auto mb-4" />
              <p className="text-pink-600 dark:text-purple-400">No letters yet. Start writing your first letter!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {letters.map((letter) => (
                <div
                  key={letter.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="w-5 h-5 text-pink-500 dark:text-purple-400" />
                      <h3 className="text-xl text-pink-900 dark:text-purple-100 font-medium">
                        {letter.recipientName ? `To: ${letter.recipientName}` : 'Untitled Letter'}
                      </h3>
                    </div>
                    
                    <div className="bg-pink-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4 border border-pink-200 dark:border-purple-700">
                      <p className="text-pink-800 dark:text-purple-300 text-sm line-clamp-6 whitespace-pre-wrap">
                        {letter.message || 'Empty letter...'}
                      </p>
                    </div>
                    
                    <p className="text-xs text-pink-500 dark:text-purple-500 mb-4">
                      Last updated: {new Date(letter.updatedAt).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => openLetter(letter)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        onClick={() => deleteLetter(letter.id)}
                        className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {letters.length > 0 && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700/50 text-center">
              <p className="text-purple-900 dark:text-purple-200 text-lg mb-2">
                📬 You've written <span className="font-bold">{letters.length}</span> heartfelt {letters.length === 1 ? 'letter' : 'letters'}
              </p>
              <p className="text-purple-700 dark:text-purple-400 text-sm">
                Keep writing to the people who matter in your life
              </p>
            </div>
          )}
        </div>
      ) : (
        // Letter Editor View
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-pink-600 dark:text-purple-300" />
                  <h3 className="text-xl text-pink-900 dark:text-purple-100">Write Your Letter</h3>
                </div>
                <button
                  onClick={closeLetter}
                  className="p-2 rounded-lg hover:bg-pink-200 dark:hover:bg-purple-800 transition-all"
                >
                  <X className="w-6 h-6 text-pink-900 dark:text-purple-200" />
                </button>
              </div>
              
              {/* Recipient Name Input */}
              <div>
                <label className="block text-pink-700 dark:text-purple-300 text-sm mb-2">To:</label>
                <input
                  type="text"
                  value={currentLetter.recipientName}
                  onChange={(e) => handleRecipientChange(e.target.value)}
                  onBlur={autoSave}
                  placeholder="Who is this letter for? (Future Me, Mom, Best Friend, etc.)"
                  className="w-full text-lg px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-8">
              {/* Letter Body */}
              <div className="mb-6">
                <label className="block text-pink-700 dark:text-purple-300 text-sm mb-2">Your Message:</label>
                <textarea
                  value={currentLetter.message}
                  onChange={(e) => handleMessageChange(e.target.value)}
                  onBlur={autoSave}
                  placeholder="Dear [Name],&#10;&#10;Write your heartfelt message here...&#10;&#10;Share your thoughts, dreams, hopes, gratitude, or anything from your heart. Everything you write is saved automatically."
                  className="w-full min-h-[500px] px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-y font-serif leading-relaxed"
                  style={{ lineHeight: '1.8' }}
                />
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t-2 border-pink-200 dark:border-purple-700">
                <button
                  onClick={handleManualSave}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Letter
                </button>
                <span className="text-sm text-pink-600 dark:text-purple-400">
                  {currentLetter.message.split(/\s+/).filter(w => w.length > 0).length} words • {currentLetter.message.length} characters
                </span>
                <div className="flex items-center gap-2 text-pink-700 dark:text-purple-300">
                  <Send className="w-4 h-4" />
                  <span className="text-sm">
                    {new Date(currentLetter.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-pink-50 dark:bg-purple-900/20 border-t-2 border-pink-200 dark:border-purple-700 text-center">
              <p className="text-xs text-pink-600 dark:text-purple-400">
                💡 Everything saves automatically as you type. Close when you're done!
              </p>
            </div>
          </div>

          {/* Letter Preview Card */}
          <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700/50">
            <h4 className="text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Letter Preview
            </h4>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-purple-200 dark:border-purple-700 shadow-inner">
              {currentLetter.recipientName && (
                <p className="text-purple-900 dark:text-purple-100 mb-4 italic">
                  Dear {currentLetter.recipientName},
                </p>
              )}
              <p className="text-purple-800 dark:text-purple-300 whitespace-pre-wrap mb-4 font-serif leading-relaxed">
                {currentLetter.message || 'Start writing to see your letter preview...'}
              </p>
              {currentLetter.message && (
                <p className="text-purple-900 dark:text-purple-100 text-right italic">
                  With love,<br />
                  {currentUser}
                </p>
              )}
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
        {saveStatus === 'saved' && currentLetter && (
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