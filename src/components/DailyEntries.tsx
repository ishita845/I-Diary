// ================= IMPORTS =================
import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Edit2,
  Check,
  X,
  List,
  Image as ImageIcon,
} from "lucide-react";

import { DiaryCalendar } from "./DiaryCalendar";

import { auth, db, storage } from "../config/firebase";

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

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { onAuthStateChanged } from "firebase/auth";

// ================= TYPES =================
interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: string;
  weather?: string;
  image?: string;
  video?: string;
}

// ================= COMPONENT =================
export function DailyEntries() {
  const [userId, setUserId] = useState<string | null>(null);

  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [viewMode, setViewMode] =
    useState<"list" | "calendar">("list");

  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    title: "",
    content: "",
    mood: "neutral",
    weather: "sunny",
    image: "",
    video: "",
  });

  const [editEntry, setEditEntry] =
    useState<Partial<DiaryEntry>>({});

  // ================= AUTH =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });

    return () => unsub();
  }, []);

  // ================= LOAD =================
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

  // ================= ADD ENTRY =================
  const handleAdd = async () => {
    if (!userId) return;

    if (!newEntry.content.trim()) {
      alert("Write something!");
      return;
    }

    const id = Date.now().toString();

    const entry: DiaryEntry = {
      id,
      ...newEntry,
    };

    await setDoc(
      doc(db, "users", userId, "diaryEntries", id),
      entry
    );

    setEntries((prev) => [entry, ...prev]);

    setIsAdding(false);

    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      title: "",
      content: "",
      mood: "neutral",
      weather: "sunny",
      image: "",
      video: "",
    });
  };

  // ================= IMAGE UPLOAD =================
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      if (isEdit) {
        setEditEntry({
          ...editEntry,
          image: base64,
        });
      } else {
        setNewEntry({
          ...newEntry,
          image: base64,
        });
      }
    };

    reader.readAsDataURL(file);
  };

  // ================= VIDEO UPLOAD =================
  const handleVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = e.target.files?.[0];

    if (!file || !userId) return;

    if (file.size > 20 * 1024 * 1024) {
      alert("Video must be under 20MB");
      return;
    }

    if (!file.type.startsWith("video/")) {
      alert("Upload a video");
      return;
    }

    try {
      const storageRef = ref(
        storage,
        `diaryVideos/${userId}/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);

      const url = await getDownloadURL(storageRef);

      if (isEdit) {
        setEditEntry({
          ...editEntry,
          video: url,
        });
      } else {
        setNewEntry({
          ...newEntry,
          video: url,
        });
      }
    } catch (error) {
      console.error(error);
      alert("Video upload failed");
    }
  };

  // ================= REMOVE =================
  const handleRemoveImage = (isEdit = false) => {
    if (isEdit) {
      setEditEntry({
        ...editEntry,
        image: "",
      });
    } else {
      setNewEntry({
        ...newEntry,
        image: "",
      });
    }
  };

  const handleRemoveVideo = (isEdit = false) => {
    if (isEdit) {
      setEditEntry({
        ...editEntry,
        video: "",
      });
    } else {
      setNewEntry({
        ...newEntry,
        video: "",
      });
    }
  };

  // ================= EDIT =================
  const handleEdit = (id: string) => {
    const found = entries.find((e) => e.id === id);

    if (!found) return;

    setEditingId(id);
    setEditEntry(found);
  };

  const handleSaveEdit = async () => {
    if (!userId || !editingId) return;

    await updateDoc(
      doc(db, "users", userId, "diaryEntries", editingId),
      editEntry
    );

    setEntries((prev) =>
      prev.map((e) =>
        e.id === editingId
          ? ({ ...e, ...editEntry } as DiaryEntry)
          : e
      )
    );

    setEditingId(null);
    setEditEntry({});
  };

  const handleDelete = async (id: string) => {
    if (!userId) return;

    await deleteDoc(
      doc(db, "users", userId, "diaryEntries", id)
    );

    setEntries((prev) =>
      prev.filter((e) => e.id !== id)
    );
  };

  // ================= RETURN =================
  return (
    <div className="space-y-6">
      {/* ADD ENTRY BUTTON */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        Write About Today
      </button>

      {/* FORM */}
      {isAdding && (
        <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-xl border border-pink-200 dark:border-purple-700">
          <input
            type="text"
            placeholder="Title"
            value={newEntry.title}
            onChange={(e) =>
              setNewEntry({
                ...newEntry,
                title: e.target.value,
              })
            }
            className="w-full px-4 py-2 rounded-lg border"
          />

          <textarea
            rows={8}
            placeholder="Write here..."
            value={newEntry.content}
            onChange={(e) =>
              setNewEntry({
                ...newEntry,
                content: e.target.value,
              })
            }
            className="w-full px-4 py-3 rounded-lg border"
          />

          {/* IMAGE */}
          <div>
            <label className="block mb-2">
              📸 Upload Image
            </label>

            {newEntry.image ? (
              <div className="relative">
                <img
                  src={newEntry.image}
                  className="w-full max-h-80 object-cover rounded-lg"
                />

                <button
                  onClick={() =>
                    handleRemoveImage(false)
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e, false)
                  }
                />
              </>
            )}
          </div>

          {/* VIDEO */}
          <div>
            <label className="block mb-2">
              🎥 Upload Video
            </label>

            {newEntry.video ? (
              <div className="relative">
                <video
                  controls
                  className="w-full max-h-96 rounded-lg"
                >
                  <source src={newEntry.video} />
                </video>

                <button
                  onClick={() =>
                    handleRemoveVideo(false)
                  }
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    handleVideoUpload(e, false)
                  }
                />
              </>
            )}
          </div>

          <button
            onClick={handleAdd}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg"
          >
            <Check className="w-5 h-5 inline mr-2" />
            Save Entry
          </button>
        </div>
      )}

      {/* ENTRIES */}
      <div className="space-y-6">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-pink-200 dark:border-purple-700"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl">
                {entry.title || "Untitled"}
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(entry.id)}
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    handleDelete(entry.id)
                  }
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <p className="whitespace-pre-wrap">
              {entry.content}
            </p>

            {/* IMAGE */}
            {entry.image && (
              <img
                src={entry.image}
                className="w-full mt-4 rounded-lg max-h-96 object-cover"
              />
            )}

            {/* VIDEO */}
            {entry.video && (
              <video
                controls
                className="w-full mt-4 rounded-lg max-h-96"
              >
                <source src={entry.video} />
              </video>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
