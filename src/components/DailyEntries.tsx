import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Edit2,
  Check,
  X,
  List,
  Image as ImageIcon ,
} from "lucide-react";
import { DiaryCalendar } from "./DiaryCalendar";

import { auth, db } from "../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ================= TYPES ================= */
interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  weather?: string;
   image?: string; // base64 encoded image
}

/* ================= COMPONENT ================= */
export function DailyEntries() {
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    content: "",
    mood: "neutral",
    weather: "sunny",
     image: '',
  });

  const [editEntry, setEditEntry] = useState<Partial<DiaryEntry>>({});

  /* ================= AUTH LISTENER (FIX #1) ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("AUTH USER:", user.uid);
        setUserId(user.uid);
      }
    });

    return () => unsub();
  }, []);

  /* ================= LOAD FROM FIRESTORE ================= */
  useEffect(() => {
    if (!userId) return;

    const loadEntries = async () => {
      const q = query(
        collection(db, "users", userId, "diaryEntries"),
        orderBy("date", "desc")
      );

      const snap = await getDocs(q);
      const data: DiaryEntry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DiaryEntry, "id">),
      }));

      setEntries(data);
    };

    loadEntries();
  }, [userId]);

  /* ================= ADD ENTRY (FIX #2) ================= */
  const handleAdd = async () => {
    if (!userId) {
      alert("User not ready yet. Please wait.");
      return;
    }

    if (!newEntry.content.trim()) {
      alert("Write something about your day!");
      return;
    }

    const entryId = Date.now().toString();

    const entry: DiaryEntry = {
      id: entryId,
      ...newEntry,
    };

    console.log("SAVING ENTRY:", entry);

    await setDoc(
      doc(db, "users", userId, "diaryEntries", entryId),
      entry
    );

    setEntries((prev) => [entry, ...prev]); // no duplicates
    setIsAdding(false);

    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      title: "",
      content: "",
      mood: "neutral",
      weather: "sunny",
       image: '',
    });
  };
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isEdit) {
        setEditEntry({ ...editEntry, image: base64String });
      } else {
        setNewEntry({ ...newEntry, image: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditEntry({ ...editEntry, image: '' });
    } else {
      setNewEntry({ ...newEntry, image: '' });
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (id: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setEditEntry(e);
  };

  const handleSaveEdit = async () => {
    if (!userId || !editingId) return;

    if (!editEntry.content?.trim()) {
      alert("Entry cannot be empty!");
      return;
    }


    const updated = entries.map((e) =>
      e.id === editingId ? ({ ...e, ...editEntry } as DiaryEntry) : e
    );

    await updateDoc(
      doc(db, "users", userId, "diaryEntries", editingId),
      editEntry
    );

    setEntries(updated);
    setEditingId(null);
    setEditEntry({});
  };
   const handleCancelEdit = () => {
    setEditingId(null);
    setEditEntry({});
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;

    if (!confirm("Delete this diary entry?")) return;

    await deleteDoc(doc(db, "users", userId, "diaryEntries", id));
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  /* ================= UI CONSTANTS ================= */
  const moodEmojis = {
    amazing: "🤩",
    happy: "😊",
    grateful: "🙏",
    calm: "😌",
    neutral: "😐",
    tired: "😴",
    sad: "😢",
    anxious: "😰",
    angry: "😠",
    confused: "😕",
  };

  const weatherEmojis = {
    sunny: "☀️",
    cloudy: "☁️",
    rainy: "🌧️",
    stormy: "⛈️",
    snowy: "❄️",
    windy: "💨",
  };

  const moodColors = {
    neutral:
      "from-gray-100 to-slate-100 dark:from-gray-800/40 dark:to-slate-800/40 border-gray-300 dark:border-gray-700",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });



  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-pink-200 mb-2">📖 My Daily Diary</h2>
        <p className="text-pink-700 dark:text-pink-400 italic">Where every day becomes a memory...</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 rounded-lg p-4 text-center border border-pink-200 dark:border-pink-700">
          <p className="text-2xl">📝</p>
          <p className="text-pink-900 dark:text-pink-200 mt-1">{entries.length}</p>
          <p className="text-xs text-pink-600 dark:text-pink-400">Total Entries</p>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-700">
          <p className="text-2xl">📅</p>
          <p className="text-purple-900 dark:text-purple-200 mt-1">
            {entries.length > 0 ? formatDate(entries[0].date).split(',')[0] : 'Start Today'}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">Latest Entry</p>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-teal-100 dark:from-blue-900/40 dark:to-teal-900/40 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-700">
          <p className="text-2xl">💭</p>
          <p className="text-blue-900 dark:text-blue-200 mt-1">
            {entries.reduce((sum, e) => sum + e.content.length, 0)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Words Written</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-lg p-4 text-center border border-yellow-200 dark:border-yellow-700">
          <p className="text-2xl">✨</p>
          <p className="text-orange-900 dark:text-orange-200 mt-1">Keep Going!</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">You're Amazing</p>
        </div>
      </div>

      {/* Add New Entry Button */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
      >
        <Plus className="w-6 h-6" />
        Write About Today
      </button>

      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            viewMode === 'list'
              ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
              : 'bg-pink-100 dark:bg-gray-700 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-600'
          }`}
        >
          <List className="w-4 h-4" />
          List View
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            viewMode === 'calendar'
              ? 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-md'
              : 'bg-pink-100 dark:bg-gray-700 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-600'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          Calendar View
        </button>
      </div>

      {/* Add Entry Form */}
      {isAdding && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 border-2 border-pink-300 dark:border-pink-700 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="text-center mb-4">
            <h3 className="text-xl text-pink-900 dark:text-pink-200">✍️ New Diary Entry</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-pink-900 dark:text-pink-200 mb-2 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date
              </label>
              <input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
              />
            </div>

            <div>
              <label className="block text-pink-900 dark:text-pink-200 mb-2">Today's Mood</label>
              <select
                value={newEntry.mood}
                onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
              >
                {Object.entries(moodEmojis).map(([mood, emoji]) => (
                  <option key={mood} value={mood}>
                    {emoji} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-pink-900 dark:text-pink-200 mb-2">Weather</label>
              <select
                value={newEntry.weather}
                onChange={(e) => setNewEntry({ ...newEntry, weather: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
              >
                {Object.entries(weatherEmojis).map(([weather, emoji]) => (
                  <option key={weather} value={weather}>
                    {emoji} {weather.charAt(0).toUpperCase() + weather.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2">Title (Optional)</label>
            <input
              type="text"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              placeholder="Give your day a title..."
              className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
            />
          </div>

          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2">Dear Diary...</label>
            <textarea
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              placeholder="What happened today? How do you feel? What are you grateful for? What's on your mind?&#10;&#10;Write freely... this is your safe space."
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Add a Photo (Optional)
            </label>
            {newEntry.image ? (
              <div className="relative">
                <img 
                  src={newEntry.image} 
                  alt="Diary entry" 
                  className="w-full max-h-64 object-cover rounded-lg border-2 border-pink-300 dark:border-purple-700"
                />
                <button
                  onClick={() => handleRemoveImage(false)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-pink-300 dark:border-purple-700 rounded-lg p-6 text-center hover:border-purple-400 transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, false)}
                  className="hidden"
                  id="image-upload-new"
                />
                <label htmlFor="image-upload-new" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 mx-auto text-pink-400 dark:text-purple-400 mb-2" />
                  <p className="text-pink-900 dark:text-pink-200">Click to upload an image</p>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">Max size: 2MB</p>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Save Entry
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 bg-pink-200 dark:bg-gray-700 text-pink-900 dark:text-pink-200 py-3 rounded-lg hover:bg-pink-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="space-y-6">
          <DiaryCalendar 
            entries={entries} 
            onDateClick={(date) => setSelectedDate(date)}
            selectedDate={selectedDate}
          />
          
          {selectedDate && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl text-pink-900 dark:text-pink-200">
                  Entries for {formatDate(selectedDate)}
                </h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-pink-600 dark:text-pink-400 hover:underline text-sm"
                >
                  Clear selection
                </button>
              </div>
              {entries
                .filter(entry => entry.date === selectedDate)
                .map(entry => (
                  <div
                    key={entry.id}
                    className={`bg-gradient-to-br ${
                      entry.mood ? moodColors[entry.mood as keyof typeof moodColors] : moodColors.neutral
                    } border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
                  >
                    {editingId === entry.id ? (
                      // Edit Mode (same as below in list view)
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <input
                            type="date"
                            value={editEntry.date}
                            onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })}
                            className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                          />
                          <select
                            value={editEntry.mood}
                            onChange={(e) => setEditEntry({ ...editEntry, mood: e.target.value })}
                            className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                          >
                            {Object.entries(moodEmojis).map(([mood, emoji]) => (
                              <option key={mood} value={mood}>
                                {emoji} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editEntry.weather}
                            onChange={(e) => setEditEntry({ ...editEntry, weather: e.target.value })}
                            className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                          >
                            {Object.entries(weatherEmojis).map(([weather, emoji]) => (
                              <option key={weather} value={weather}>
                                {emoji} {weather.charAt(0).toUpperCase() + weather.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={editEntry.title}
                          onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                          placeholder="Title"
                          className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                        />
                        <textarea
                          value={editEntry.content}
                          onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
                          rows={10}
                          className="w-full px-4 py-3 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-pink-300 dark:border-pink-700">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">
                              {entry.mood ? moodEmojis[entry.mood as keyof typeof moodEmojis] : '📝'}
                            </span>
                            <div>
                              <p className="text-pink-900 dark:text-pink-200">
                                {formatDate(entry.date)}
                              </p>
                              {entry.weather && (
                                <p className="text-sm text-pink-700 dark:text-pink-400">
                                  {weatherEmojis[entry.weather as keyof typeof weatherEmojis]} {entry.weather.charAt(0).toUpperCase() + entry.weather.slice(1)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(entry.id)}
                              className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors p-2"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {entry.title && (
                          <h3 className="text-xl text-pink-900 dark:text-pink-200 mb-3 italic">
                            "{entry.title}"
                          </h3>
                        )}
                        <div className="whitespace-pre-wrap text-pink-900 dark:text-pink-100 leading-relaxed text-lg mb-4">
                          {entry.content}
                        </div>

                        {/* Entry Image */}
                        {entry.image && (
                          <div className="mt-4">
                            <img 
                              src={entry.image} 
                              alt="Diary memory" 
                              className="w-full max-h-96 object-cover rounded-lg border-2 border-pink-300 dark:border-purple-700 shadow-md"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              {entries.filter(entry => entry.date === selectedDate).length === 0 && (
                <div className="text-center py-12 text-pink-600 dark:text-pink-400">
                  <p>No entries for this date. Click "Write About Today" to add one!</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-6xl mb-4">📔</p>
              <p className="text-xl text-pink-900 dark:text-pink-200 mb-2">Your diary is waiting for you...</p>
              <p className="text-pink-600 dark:text-pink-400 italic">Start writing about your day and create beautiful memories</p>
            </div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.id}
                className={`bg-gradient-to-br ${
                  entry.mood ? moodColors[entry.mood as keyof typeof moodColors] : moodColors.neutral
                } border-2 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
              >
                {editingId === entry.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <input
                        type="date"
                        value={editEntry.date}
                        onChange={(e) => setEditEntry({ ...editEntry, date: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                      />
                      <select
                        value={editEntry.mood}
                        onChange={(e) => setEditEntry({ ...editEntry, mood: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                      >
                        {Object.entries(moodEmojis).map(([mood, emoji]) => (
                          <option key={mood} value={mood}>
                            {emoji} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editEntry.weather}
                        onChange={(e) => setEditEntry({ ...editEntry, weather: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                      >
                        {Object.entries(weatherEmojis).map(([weather, emoji]) => (
                          <option key={weather} value={weather}>
                            {emoji} {weather.charAt(0).toUpperCase() + weather.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editEntry.title}
                      onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                      placeholder="Title"
                      className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
                    />
                    <textarea
                      value={editEntry.content}
                      onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-3 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-all"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    {/* Entry Header */}
                    <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-pink-300 dark:border-pink-700">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {entry.mood ? moodEmojis[entry.mood as keyof typeof moodEmojis] : '📝'}
                        </span>
                        <div>
                          <p className="text-pink-900 dark:text-pink-200">
                            {formatDate(entry.date)}
                          </p>
                          {entry.weather && (
                            <p className="text-sm text-pink-700 dark:text-pink-400">
                              {weatherEmojis[entry.weather as keyof typeof weatherEmojis]} {entry.weather.charAt(0).toUpperCase() + entry.weather.slice(1)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(entry.id)}
                          className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors p-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Entry Title */}
                    {entry.title && (
                      <h3 className="text-xl text-pink-900 dark:text-pink-200 mb-3 italic">
                        "{entry.title}"
                      </h3>
                    )}

                    {/* Entry Content */}
                    <div className="whitespace-pre-wrap text-pink-900 dark:text-pink-100 leading-relaxed text-lg mb-4">
                      {entry.content}
                    </div>

                    {/* Entry Image */}
                    {entry.image && (
                      <div className="mt-4">
                        <img 
                          src={entry.image} 
                          alt="Diary memory" 
                          className="w-full max-h-96 object-cover rounded-lg border-2 border-pink-300 dark:border-purple-700 shadow-md"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Quote */}
      <div className="text-center p-5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl border-2 border-pink-300 dark:border-pink-700">
        <p className="text-pink-900 dark:text-pink-200 italic">
          "In the pages of your diary, every moment becomes eternal." ✨
        </p>
      </div>
    </div>
  );
}
