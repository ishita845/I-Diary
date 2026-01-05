import { useState, useEffect } from "react";
import { Plus, Trash2, Music, User, Heart, MessageCircle, Palette } from "lucide-react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

interface FavoriteItem {
  id: string;
  text: string;
  reason: string;
  category: "songs" | "characters" | "couples" | "quotes" | "aesthetics";
}

export function FavoritesSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<FavoriteItem["category"]>("songs");
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ text: "", reason: "" });

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
          doc(db, "users", userId, "favorites", "data")
        );
        if (snap.exists()) {
          setFavorites(snap.data().items || []);
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    };

    load();
  }, [userId]);

  /* ================= SAVE TO FIRESTORE ================= */

  const saveFavorites = async (updated: FavoriteItem[]) => {
    setFavorites(updated);
    if (!userId) return;

    try {
      await setDoc(
        doc(db, "users", userId, "favorites", "data"),
        { items: updated },
        { merge: true }
      );
    } catch (err) {
      console.error("Failed to save favorites:", err);
    }
  };

  /* ================= ACTIONS ================= */

  const handleAdd = async () => {
    if (!newItem.text.trim()) {
      alert("Please enter the item!");
      return;
    }

    const item: FavoriteItem = {
      id: Date.now().toString(),
      text: newItem.text,
      reason: newItem.reason,
      category: activeCategory,
    };

    await saveFavorites([...favorites, item]);
    setNewItem({ text: "", reason: "" });
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remove this favorite?")) {
      await saveFavorites(favorites.filter((f) => f.id !== id));
    }
  };

  /* ================= UI (UNCHANGED) ================= */

  const categories = [
    { id: "songs" as const, label: "Songs", icon: Music, placeholder: "Song name or lyrics" },
    { id: "characters" as const, label: "Characters", icon: User, placeholder: "Character name" },
    { id: "couples" as const, label: "Couples", icon: Heart, placeholder: "Couple names" },
    { id: "quotes" as const, label: "Quotes", icon: MessageCircle, placeholder: "Your favorite quote" },
    { id: "aesthetics" as const, label: "Aesthetics", icon: Palette, placeholder: "Aesthetic or vibe" },
  ];

  const currentCategory = categories.find((c) => c.id === activeCategory)!;
  const filteredFavorites = favorites.filter(
    (f) => f.category === activeCategory
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-pink-200 mb-2">💖 My Favorites</h2>
        <p className="text-pink-700 dark:text-pink-400 italic">Quick lists of everything you love...</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
                  : 'bg-pink-100 dark:bg-gray-700 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add to {currentCategory.label}
      </button>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-6 space-y-4">
          <textarea
            placeholder={currentCategory.placeholder}
            value={newItem.text}
            onChange={(e) => setNewItem({ ...newItem, text: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
          />

          <textarea
            placeholder="Why it's special to you..."
            value={newItem.reason}
            onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-all"
            >
              Add Favorite
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 bg-pink-200 dark:bg-gray-700 text-pink-900 dark:text-pink-200 py-2 rounded-lg hover:bg-pink-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Favorites List */}
      <div className="space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="text-center py-12 text-pink-600 dark:text-pink-400">
            <p>No {currentCategory.label.toLowerCase()} added yet. Start your list! ✨</p>
          </div>
        ) : (
          filteredFavorites.map((item, index) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 border border-pink-200 dark:border-pink-700 rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <span className="text-pink-500 dark:text-pink-400 mt-1">✨</span>
                    <div className="flex-1">
                      <p className="text-pink-900 dark:text-pink-100">{item.text}</p>
                      {item.reason && (
                        <p className="text-sm text-pink-700 dark:text-pink-400 mt-2 italic pl-3 border-l-2 border-pink-300 dark:border-pink-600">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}