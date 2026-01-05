import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  BookOpen,
  Edit3,
  Loader,
  Check,
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

interface FreePage {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/* ================= COMPONENT ================= */

export function FreePagesSection() {
  const [userId, setUserId] = useState<string | null>(null);

  const [pages, setPages] = useState<FreePage[]>([]);
  const [currentPage, setCurrentPage] = useState<FreePage | null>(null);

  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD FROM FIREBASE ================= */

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", userId, "freePages", "pages")
        );
        if (snap.exists()) {
          setPages(snap.data().pages || []);
        }
      } catch (e) {
        console.error("Load failed", e);
      }
    };

    load();
  }, [userId]);

  /* ================= SAVE TO FIREBASE ================= */

  const persist = async (updatedPages: FreePage[]) => {
    if (!userId) return;

    await setDoc(
      doc(db, "users", userId, "freePages", "pages"),
      { pages: updatedPages },
      { merge: true }
    );
  };

  const autoSave = () => {
    if (!currentPage) return;

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    setSaveStatus("saving");

    autoSaveTimeout.current = setTimeout(async () => {
      try {
        const updatedPages = pages.some((p) => p.id === currentPage.id)
          ? pages.map((p) =>
              p.id === currentPage.id
                ? { ...currentPage, updatedAt: new Date().toISOString() }
                : p
            )
          : [
              { ...currentPage, updatedAt: new Date().toISOString() },
              ...pages,
            ];

        setPages(updatedPages);
        await persist(updatedPages);
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);
  };

  useEffect(() => {
    if (currentPage) autoSave();
  }, [currentPage]);

 const handleManualSave = async () => {
  if (!currentPage) return;

  setSaveStatus("saving");

  try {
    const updatedPages = pages.some((p) => p.id === currentPage.id)
      ? pages.map((p) =>
          p.id === currentPage.id
            ? { ...currentPage, updatedAt: new Date().toISOString() }
            : p
        )
      : [
          { ...currentPage, updatedAt: new Date().toISOString() },
          ...pages,
        ];

    setPages(updatedPages);
    await persist(updatedPages);

    setSaveStatus("saved");

    // ✅ CLOSE PAGE AFTER SAVE
    setTimeout(() => {
      setCurrentPage(null);
    }, 200);
  } catch {
    setSaveStatus("error");
  }
};


  /* ================= CRUD ================= */
   const handleTitleChange = (value: string) => {
    if (currentPage) {
      setCurrentPage({ ...currentPage, title: value });
    }
  };
    const handleContentChange = (value: string) => {
    if (currentPage) {
      setCurrentPage({ ...currentPage, content: value });
    }
  };

  const createNewPage = () => {
    const now = new Date().toISOString();
    setCurrentPage({
      id: Date.now().toString(),
      title: "",
      content: "",
      images: [],
      createdAt: now,
      updatedAt: now,
    });
  };

  const openPage = (page: FreePage) => setCurrentPage(page);
  const closePage = () => setCurrentPage(null);

  const deletePage = async (id: string) => {
    if (!confirm("Delete this page?")) return;

    const updated = pages.filter((p) => p.id !== id);
    setPages(updated);
    await persist(updated);

    if (currentPage?.id === id) setCurrentPage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentPage) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCurrentPage({
        ...currentPage,
        images: [...currentPage.images, ev.target?.result as string],
      });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    if (!currentPage) return;
    setCurrentPage({
      ...currentPage,
      images: currentPage.images.filter((_, i) => i !== index),
    });
  };
    const handleKeyPress = (e: React.KeyboardEvent) => {
    // Auto-save is already handled by useEffect, just let the user type
    if (e.key === 'Enter' && e.ctrlKey) {
      // Ctrl+Enter could close the editor if desired
      closePage();
    }
  };

  /* ================= UI (UNCHANGED) ================= */

 


  return (
    <div className="min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">📖 Free Pages</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Your personal journal - write freely, save automatically</p>
      </div>

      {!currentPage ? (
        // Pages List View
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-6 border-2 border-pink-300 dark:border-purple-700">
            <p className="text-pink-900 dark:text-purple-200 text-center italic mb-4">
              ✨ No structure, no rules—just your thoughts flowing onto the page...
            </p>
            <button
              onClick={createNewPage}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Page
            </button>
          </div>

          {pages.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border-2 border-pink-200 dark:border-purple-700/50 text-center">
              <BookOpen className="w-16 h-16 text-pink-300 dark:text-purple-600 mx-auto mb-4" />
              <p className="text-pink-600 dark:text-purple-400">No pages yet. Start writing your first page!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-lg hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="p-6">
                    <h3 className="text-xl text-pink-900 dark:text-purple-100 mb-2 truncate">
                      {page.title || 'Untitled Page'}
                    </h3>
                    <p className="text-pink-700 dark:text-purple-400 text-sm mb-4 line-clamp-3">
                      {page.content || 'Empty page...'}
                    </p>
                    {page.images.length > 0 && (
                      <div className="flex gap-2 mb-4 overflow-hidden">
                        {page.images.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border-2 border-pink-200 dark:border-purple-700">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {page.images.length > 3 && (
                          <div className="w-16 h-16 rounded-lg bg-pink-100 dark:bg-purple-900/30 border-2 border-pink-200 dark:border-purple-700 flex items-center justify-center">
                            <span className="text-pink-600 dark:text-purple-400 text-xs">+{page.images.length - 3}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-pink-500 dark:text-purple-500 mb-4">
                      Last updated: {new Date(page.updatedAt).toLocaleDateString('en-IN')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPage(page)}
                        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Open
                      </button>
                      <button
                        onClick={() => deletePage(page.id)}
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
        </div>
      ) : (
        // Page Editor View
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-200 dark:border-purple-700/50 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700 flex items-center justify-between">
              <div className="flex-1">
                <input
                  type="text"
                  value={currentPage.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={autoSave}
                  placeholder="Page title..."
                  className="w-full text-2xl bg-transparent text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:outline-none"
                />
              </div>
              <button
                onClick={closePage}
                className="p-2 rounded-lg hover:bg-pink-200 dark:hover:bg-purple-800 transition-all"
              >
                <X className="w-6 h-6 text-pink-900 dark:text-purple-200" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-6">
              {/* Image Gallery */}
              {currentPage.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentPage.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg border-2 border-pink-200 dark:border-purple-700"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Text Editor */}
              <textarea
                value={currentPage.content}
                onChange={(e) => handleContentChange(e.target.value)}
                onBlur={autoSave}
                onKeyDown={handleKeyPress}
                placeholder="Start writing... Everything you type is saved automatically."
                className="w-full min-h-[400px] px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-y"
              />

              {/* Toolbar */}
              <div className="flex items-center gap-4 pt-4 border-t-2 border-pink-200 dark:border-purple-700">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </button>
                <button
                  onClick={handleManualSave}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Page
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-sm text-pink-600 dark:text-purple-400">
                  {currentPage.content.length} characters
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-pink-50 dark:bg-purple-900/20 border-t-2 border-pink-200 dark:border-purple-700 text-center">
              <p className="text-xs text-pink-600 dark:text-purple-400">
                💡 Everything saves automatically as you type. Press Ctrl+Enter to close.
              </p>
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
        {saveStatus === 'saved' && currentPage && (
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