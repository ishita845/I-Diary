import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Image as ImageIcon, X, Sparkles,
  Check, Loader, Edit3, Save, List, Grid3x3, Search
} from "lucide-react";

import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ================= TYPES ================= */

interface Wish {
  id: string;
  title: string;
  wish: string;
  images: string[];
  achieved: boolean;
  createdAt: string;
  updatedAt: string;
  achievedAt?: string;
}

/* ================= COMPONENT ================= */

export function FutureWishlistSection() {
  const [userId, setUserId] = useState<string | null>(null);

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [currentWish, setCurrentWish] = useState<Wish | null>(null);

  const [saveStatus, setSaveStatus] =
    useState<"saved" | "saving" | "error">("saved");

  const autoSaveTimeout = useRef<NodeJS.Timeout | null>(null);

  const [filter, setFilter] = useState<"all" | "pending" | "achieved">("all");
  const [viewMode, setViewMode] = useState<"box" | "list">("box");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [newWishTitle, setNewWishTitle] = useState("");
  const [newWishContent, setNewWishContent] = useState("");
  const [newWishImages, setNewWishImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const newWishFileInputRef = useRef<HTMLInputElement>(null);

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD FROM FIRESTORE ================= */

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const snap = await getDoc(
          doc(db, "users", userId, "wishlist", "data")
        );
        if (snap.exists()) {
          setWishes(snap.data().items || []);
        }
      } catch (err) {
        console.error("Failed to load wishes:", err);
      }
    };

    load();
  }, [userId]);

  /* ================= SAVE TO FIRESTORE ================= */

  const persist = async (updated: Wish[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, "users", userId, "wishlist", "data"),
      { items: updated },
      { merge: true }
    );
  };

  const autoSave = () => {
    if (!currentWish) return;

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    setSaveStatus("saving");

    autoSaveTimeout.current = setTimeout(() => {
      saveWish();
    }, 500);
  };

  const saveWish = async () => {
    if (!currentWish) return;

    try {
      const updated = wishes.map((w) =>
        w.id === currentWish.id
          ? { ...currentWish, updatedAt: new Date().toISOString() }
          : w
      );

      if (!wishes.find((w) => w.id === currentWish.id)) {
        updated.unshift({
          ...currentWish,
          updatedAt: new Date().toISOString(),
        });
      }

      setWishes(updated);
      await persist(updated);

      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  /* ================= CREATE / DELETE ================= */

  const createNewWishFromForm = async () => {
    if (!newWishTitle.trim()) {
      alert("Please enter a title for your wish!");
      return;
    }

    const wish: Wish = {
      id: Date.now().toString(),
      title: newWishTitle,
      wish: newWishContent,
      images: newWishImages,
      achieved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [wish, ...wishes];
    setWishes(updated);
    await persist(updated);

    setNewWishTitle("");
    setNewWishContent("");
    setNewWishImages([]);
    setIsAdding(false);
    setSaveStatus("saved");
  };

  const deleteWish = async (id: string) => {
    if (!confirm("Delete this wish?")) return;

    const updated = wishes.filter((w) => w.id !== id);
    setWishes(updated);
    await persist(updated);

    if (currentWish?.id === id) setCurrentWish(null);
  };

  const toggleAchieved = async (id: string) => {
  const updated = wishes.map(w => {
    if (w.id !== id) return w;

    if (!w.achieved) {
      return {
        ...w,
        achieved: true,
        achievedAt: new Date().toISOString(),
      };
    }

    // REMOVE achievedAt instead of undefined
    const { achievedAt, ...rest } = w;
    return {
      ...rest,
      achieved: false,
    };
  });

  setWishes(updated);
  await persist(updated);

  if (currentWish?.id === id) {
    setCurrentWish(updated.find(w => w.id === id) || null);
  }
};


  /* ================= IMAGE HANDLING ================= */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentWish) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCurrentWish({
        ...currentWish,
        images: [...currentWish.images, ev.target?.result as string],
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNewWishImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewWishImages((prev) => [...prev, ev.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  /* ================= AUTOSAVE ================= */

  useEffect(() => {
    if (currentWish) autoSave();
  }, [currentWish]);

  /* ================= FILTERS ================= */

  const filteredWishes = wishes
    .filter((w) =>
      filter === "pending"
        ? !w.achieved
        : filter === "achieved"
        ? w.achieved
        : true
    )
    .filter((w) =>
      searchQuery
        ? w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.wish.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    );

  const stats = {
    total: wishes.length,
    pending: wishes.filter(w => !w.achieved).length,
    achieved: wishes.filter(w => w.achieved).length,
  };



  return (
    <div className="min-h-screen">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-purple-200 mb-2">✨ Future Wishlist</h2>
        <p className="text-pink-700 dark:text-purple-400 italic">Dream big, write freely, achieve boldly</p>
      </div>

      {!currentWish ? (
        // Wishes List View
        <div className="space-y-6">
          {/* Stats & Create Button */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl p-6 border-2 border-pink-300 dark:border-purple-700 shadow-lg">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl text-pink-900 dark:text-purple-100 font-bold">{stats.total}</p>
                <p className="text-sm text-pink-700 dark:text-purple-400">Total Wishes</p>
              </div>
              <div className="text-center">
                <p className="text-3xl text-orange-600 dark:text-orange-400 font-bold">{stats.pending}</p>
                <p className="text-sm text-pink-700 dark:text-purple-400">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-3xl text-green-600 dark:text-green-400 font-bold">{stats.achieved}</p>
                <p className="text-sm text-pink-700 dark:text-purple-400">Achieved</p>
              </div>
            </div>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {isAdding ? 'Cancel' : 'Add New Wish'}
            </button>
          </div>

          {/* Add New Wish Form */}
          {isAdding && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-300 dark:border-purple-700 shadow-xl p-6 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-pink-500 dark:text-purple-400" />
                <h3 className="text-xl text-pink-900 dark:text-purple-100">Create Your Wish</h3>
              </div>
              
              <div>
                <label className="block text-pink-900 dark:text-purple-200 mb-2 font-medium">Wish Title *</label>
                <input
                  type="text"
                  value={newWishTitle}
                  onChange={(e) => setNewWishTitle(e.target.value)}
                  placeholder="Enter a title for your wish..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                />
              </div>

              <div>
                <label className="block text-pink-900 dark:text-purple-200 mb-2 font-medium">Wish Details (Optional)</label>
                <textarea
                  value={newWishContent}
                  onChange={(e) => setNewWishContent(e.target.value)}
                  placeholder="Write about your wish in detail..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={createNewWishFromForm}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Wish
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewWishTitle('');
                    setNewWishContent('');
                    setNewWishImages([]);
                  }}
                  className="px-6 py-3 rounded-lg bg-pink-100 dark:bg-gray-700 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-pink-900 dark:text-purple-200 mb-2 font-medium">Add Images (Optional)</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => newWishFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Add Image
                  </button>
                  <input
                    ref={newWishFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleNewWishImageUpload}
                    className="hidden"
                  />
                </div>
                {newWishImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                    {newWishImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-pink-200 dark:border-purple-700"
                        />
                        <button
                          onClick={() => removeNewWishImage(idx)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wishes by title or content..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 border-2 border-pink-200 dark:border-purple-700'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-2 rounded-lg transition-all ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 border-2 border-pink-200 dark:border-purple-700'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('achieved')}
              className={`px-6 py-2 rounded-lg transition-all ${
                filter === 'achieved'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 border-2 border-pink-200 dark:border-purple-700'
              }`}
            >
              Achieved ({stats.achieved})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setViewMode('box')}
              className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'box'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 border-2 border-pink-200 dark:border-purple-700'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              Box View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-6 py-2 rounded-lg transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 border-2 border-pink-200 dark:border-purple-700'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>

          {/* Content Display */}
          {filteredWishes.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border-2 border-pink-200 dark:border-purple-700/50 text-center">
              <Sparkles className="w-16 h-16 text-pink-300 dark:text-purple-600 mx-auto mb-4" />
              <p className="text-pink-600 dark:text-purple-400">
                {searchQuery ? 'No wishes found matching your search.' :
                 filter === 'all' ? 'No wishes yet. Start dreaming!' : 
                 filter === 'pending' ? 'No pending wishes!' : 
                 'No achieved wishes yet. Keep working on them!'}
              </p>
            </div>
          ) : viewMode === 'box' ? (
            // Box View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWishes.map((wish) => (
                <div
                  key={wish.id}
                  onClick={() => openWish(wish)}
                  className={`relative rounded-xl border-2 shadow-lg hover:shadow-2xl transition-all cursor-pointer overflow-hidden group ${
                    wish.achieved
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
                      : 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-pink-300 dark:border-purple-700'
                  } hover:scale-105`}
                >
                  <div className="p-5">
                    <h3 className="text-lg text-pink-900 dark:text-purple-100 font-semibold mb-2 line-clamp-2">
                      {wish.title || 'Untitled Wish'}
                    </h3>
                    
                    <p className="text-pink-800 dark:text-purple-200 text-sm line-clamp-4 mb-3">
                      {wish.wish || 'Click to add details...'}
                    </p>
                    
                    {wish.images.length > 0 && (
                      <div className="flex gap-1 mb-3 overflow-hidden">
                        {wish.images.slice(0, 3).map((img, idx) => (
                          <div key={idx} className="w-12 h-12 rounded overflow-hidden border border-pink-200 dark:border-purple-700">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {wish.images.length > 3 && (
                          <div className="w-12 h-12 rounded bg-pink-200 dark:bg-purple-900/50 border border-pink-200 dark:border-purple-700 flex items-center justify-center text-xs text-pink-700 dark:text-purple-300">
                            +{wish.images.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Badge - Bottom Right */}
                  <div className="absolute bottom-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-md ${
                      wish.achieved
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {wish.achieved ? '✓ Achieved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // List View (Excel Style)
            <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-300 dark:border-purple-700 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-900/60 dark:to-purple-900/60">
                      <th className="px-6 py-4 text-left text-pink-900 dark:text-purple-100 font-semibold border-b-2 border-pink-300 dark:border-purple-700 w-12">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-pink-900 dark:text-purple-100 font-semibold border-b-2 border-pink-300 dark:border-purple-700">
                        Title
                      </th>
                      <th className="px-6 py-4 text-center text-pink-900 dark:text-purple-100 font-semibold border-b-2 border-pink-300 dark:border-purple-700 w-32">
                        Pending
                      </th>
                      <th className="px-6 py-4 text-center text-pink-900 dark:text-purple-100 font-semibold border-b-2 border-pink-300 dark:border-purple-700 w-32">
                        Achieved
                      </th>
                      <th className="px-6 py-4 text-center text-pink-900 dark:text-purple-100 font-semibold border-b-2 border-pink-300 dark:border-purple-700 w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWishes.map((wish, index) => (
                      <tr 
                        key={wish.id}
                        className={`border-b border-pink-100 dark:border-purple-800 hover:bg-pink-50 dark:hover:bg-purple-900/20 transition-colors ${
                          wish.achieved ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-pink-900 dark:text-purple-100 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => openWish(wish)}
                            className="text-left text-pink-900 dark:text-purple-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors font-medium"
                          >
                            {wish.title || 'Untitled Wish'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!wish.achieved}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (wish.achieved) toggleAchieved(wish.id);
                              }}
                              className="w-5 h-5 rounded border-2 border-orange-400 text-orange-600 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wish.achieved}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleAchieved(wish.id);
                              }}
                              className="w-5 h-5 rounded border-2 border-green-400 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWish(wish);
                              }}
                              className="p-2 rounded-lg bg-pink-100 dark:bg-purple-900/30 text-pink-600 dark:text-purple-400 hover:bg-pink-200 dark:hover:bg-purple-900/50 transition-all"
                              title="View/Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteWish(wish.id);
                              }}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Wish Editor View
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-pink-300 dark:border-purple-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/50 dark:to-pink-900/50 border-b-2 border-pink-200 dark:border-purple-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-pink-600 dark:text-purple-300" />
                <h3 className="text-xl text-pink-900 dark:text-purple-100 font-semibold">
                  {currentWish.achieved ? '✅ Achieved Wish' : '✨ Your Wish'}
                </h3>
              </div>
              <button
                onClick={closeWish}
                className="p-2 rounded-lg hover:bg-pink-200 dark:hover:bg-purple-800 transition-all"
              >
                <X className="w-6 h-6 text-pink-900 dark:text-purple-200" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-8 space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-pink-900 dark:text-purple-200 mb-2 font-medium">Wish Title</label>
                <input
                  type="text"
                  value={currentWish.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={autoSave}
                  placeholder="Enter a title for your wish..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                />
              </div>

              {/* Image Gallery */}
              {currentWish.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {currentWish.images.map((img, idx) => (
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
              <div>
                <label className="block text-pink-900 dark:text-purple-200 mb-2 font-medium">Wish Details</label>
                <textarea
                  value={currentWish.wish}
                  onChange={(e) => handleWishChange(e.target.value)}
                  onBlur={autoSave}
                  placeholder="Write about your wish... What do you dream of achieving? Everything saves automatically."
                  className="w-full min-h-[300px] px-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-y"
                />
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-4 pt-4 border-t-2 border-pink-200 dark:border-purple-700 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Add Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    saveWish();
                    setSaveStatus('saving');
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-md flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Wish
                </button>
                <button
                  onClick={() => toggleAchieved(currentWish.id)}
                  className={`px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-2 ${
                    currentWish.achieved
                      ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:from-orange-600 hover:to-yellow-600'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  {currentWish.achieved ? (
                    <>
                      <X className="w-4 h-4" />
                      Mark as Pending
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Mark as Achieved
                    </>
                  )}
                </button>
                <button
                  onClick={() => deleteWish(currentWish.id)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition-all shadow-md flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <span className="text-sm text-pink-600 dark:text-purple-400 ml-auto">
                  {currentWish.wish.length} characters
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-pink-50 dark:bg-purple-900/20 border-t-2 border-pink-200 dark:border-purple-700 text-center">
              <p className="text-xs text-pink-600 dark:text-purple-400">
                💡 Everything saves automatically as you type. Use "Save Wish" button to save immediately!
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
        {saveStatus === 'saved' && (currentWish || isAdding) && (
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