import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, Edit2, List, ChevronRight, Star, Search } from 'lucide-react';

import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/* ================= TYPES ================= */

interface ListItem {
  id: string;
  text: string;
  completed: boolean;
}

interface CustomList {
  id: string;
  title: string;
  emoji: string;
  items: ListItem[];
}

/* ================= COMPONENT ================= */

export function GoalsListsSection() {
  const [userId, setUserId] = useState<string | null>(null);

  const [lists, setLists] = useState<CustomList[]>([]);
  const [isAddingList, setIsAddingList] = useState(false);
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [newList, setNewList] = useState({ title: '', emoji: '📝' });
  const [addingItemToList, setAddingItemToList] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const emojiSuggestions = ['💃','🍳','📚','🎵','✈️','🎨','🏃','🎯','💪','🎬','🎮','🛍️','📝','💼','🏠','🌱'];

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!userId) return;

    const loadLists = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'goalsLists', 'data'));
        if (snap.exists()) {
          setLists(snap.data().lists || []);
        }
      } catch (e) {
        console.error('Failed to load lists', e);
      }
    };

    loadLists();
  }, [userId]);

  /* ================= SAVE ================= */

  const persist = async (updatedLists: CustomList[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, 'users', userId, 'goalsLists', 'data'),
      { lists: updatedLists },
      { merge: true }
    );
  };

  const saveLists = async (updatedLists: CustomList[]) => {
    setLists(updatedLists);
    await persist(updatedLists);
  };

  /* ================= ACTIONS ================= */

  const handleAddList = async () => {
    if (!newList.title.trim()) {
      alert('Please enter a list title!');
      return;
    }

    const list: CustomList = {
      id: Date.now().toString(),
      title: newList.title.trim(),
      emoji: newList.emoji,
      items: [],
    };

    await saveLists([...lists, list]);
    setNewList({ title: '', emoji: '📝' });
    setIsAddingList(false);
    setOpenListId(list.id);
  };

  const handleUpdateList = async (listId: string, title: string, emoji: string) => {
    const updated = lists.map(l =>
      l.id === listId ? { ...l, title, emoji } : l
    );
    await saveLists(updated);
    setEditingListId(null);
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Delete this entire list? All items will be removed.')) return;

    const updated = lists.filter(l => l.id !== listId);
    await saveLists(updated);
    if (openListId === listId) setOpenListId(null);
  };

  const handleAddItem = async (listId: string) => {
    if (!newItemText.trim()) {
      alert('Please enter an item!');
      return;
    }

    const updated = lists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: [
              ...list.items,
              {
                id: Date.now().toString(),
                text: newItemText.trim(),
                completed: false,
              },
            ],
          }
        : list
    );

    await saveLists(updated);
    setNewItemText('');
    setAddingItemToList(null);
  };

  const handleToggleItem = async (listId: string, itemId: string) => {
    const updated = lists.map(list =>
      list.id === listId
        ? {
            ...list,
            items: list.items.map(item =>
              item.id === itemId
                ? { ...item, completed: !item.completed }
                : item
            ),
          }
        : list
    );
    await saveLists(updated);
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    const updated = lists.map(list =>
      list.id === listId
        ? { ...list, items: list.items.filter(i => i.id !== itemId) }
        : list
    );
    await saveLists(updated);
  };

  const toggleListOpen = (listId: string) => {
    setOpenListId(openListId === listId ? null : listId);
  };

  const getListPreview = (list: CustomList) => {
    const total = list.items.length;
    const completed = list.items.filter(i => i.completed).length;
    return {
      total,
      completed,
      pending: total - completed,
      recentItems: list.items.slice(-3).reverse(),
    };
  };

  const filteredLists = lists.filter(l =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ================= UI (UNCHANGED) ================= */




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-pink-200 mb-2">📋 Goals & Lists</h2>
        <p className="text-pink-700 dark:text-pink-400 italic">
          Create custom lists for anything - dance songs, recipes, books, goals...
        </p>
      </div>

      {/* Add New List Button */}
      <button
        onClick={() => setIsAddingList(!isAddingList)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create New List
      </button>

      {/* Search Bar */}
      {lists.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-pink-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lists by title..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-pink-400 dark:text-pink-600 hover:text-pink-600 dark:hover:text-pink-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Add New List Form */}
      {isAddingList && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-pink-200 dark:border-pink-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl text-pink-900 dark:text-pink-200">Create New List</h3>

          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2">Choose an Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojiSuggestions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewList({ ...newList, emoji })}
                  className={`text-3xl p-2 rounded-lg transition-all ${
                    newList.emoji === emoji
                      ? 'bg-purple-200 dark:bg-purple-800 scale-110 shadow-lg'
                      : 'bg-white dark:bg-gray-700 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2">List Title *</label>
            <input
              type="text"
              placeholder="e.g., Dance Songs, Recipes to Try, Books to Read..."
              value={newList.title}
              onChange={(e) => setNewList({ ...newList, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddList}
              className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-all"
            >
              Create List
            </button>
            <button
              onClick={() => {
                setIsAddingList(false);
                setNewList({ title: '', emoji: '📝' });
              }}
              className="flex-1 bg-pink-200 dark:bg-gray-700 text-pink-900 dark:text-pink-200 py-2 rounded-lg hover:bg-pink-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Lists Display */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-pink-300 dark:border-pink-700">
          <List className="w-16 h-16 mx-auto mb-4 text-pink-400 dark:text-pink-600" />
          <p className="text-pink-600 dark:text-pink-400 mb-2">No lists yet! Create your first one.</p>
          <p className="text-pink-500 dark:text-pink-500 text-sm">
            Perfect for tracking dance songs, recipes, goals, and more! ✨
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLists.map((list) => {
            const preview = getListPreview(list);
            const isOpen = openListId === list.id;

            return isOpen ? (
              // EXPANDED VIEW - Full List
              <div
                key={list.id}
                className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-900 border-2 border-pink-300 dark:border-pink-700 rounded-xl overflow-hidden shadow-lg"
              >
                {/* List Header */}
                <div className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-purple-900/40 dark:to-pink-900/40 p-4 border-b border-pink-200 dark:border-pink-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {editingListId === list.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select
                            value={list.emoji}
                            onChange={(e) => handleUpdateList(list.id, list.title, e.target.value)}
                            className="text-2xl bg-white dark:bg-gray-700 rounded px-2 py-1"
                          >
                            {emojiSuggestions.map((emoji) => (
                              <option key={emoji} value={emoji}>
                                {emoji}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={list.title}
                            onChange={(e) => handleUpdateList(list.id, e.target.value, list.emoji)}
                            onBlur={() => setEditingListId(null)}
                            autoFocus
                            className="flex-1 px-3 py-1 rounded border border-pink-300 dark:border-pink-700 bg-white dark:bg-gray-700 text-pink-900 dark:text-pink-100"
                          />
                        </div>
                      ) : (
                        <>
                          <span className="text-3xl">{list.emoji}</span>
                          <h3 className="text-xl text-pink-900 dark:text-pink-200 flex-1">
                            {list.title}
                          </h3>
                          <span className="text-sm text-pink-600 dark:text-pink-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                            {preview.completed}/{preview.total}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingListId(list.id)}
                        className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors p-2"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id)}
                        className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => toggleListOpen(list.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* List Items */}
                <div className="p-4 space-y-3">
                  {/* Add Item Form */}
                  {addingItemToList === list.id ? (
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="Add new item..."
                        onKeyPress={(e) => e.key === 'Enter' && handleAddItem(list.id)}
                        autoFocus
                        className="flex-1 px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                      <button
                        onClick={() => handleAddItem(list.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setAddingItemToList(null);
                          setNewItemText('');
                        }}
                        className="px-4 py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-500 dark:hover:bg-gray-500 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingItemToList(list.id)}
                      className="w-full py-2 border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-lg text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Item
                    </button>
                  )}

                  {/* Items List */}
                  {list.items.length === 0 ? (
                    <p className="text-center py-6 text-pink-500 dark:text-pink-500 text-sm italic">
                      No items yet. Add your first one! ✨
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {list.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            item.completed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-800'
                          }`}
                        >
                          <button
                            onClick={() => handleToggleItem(list.id, item.id)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.completed
                                ? 'bg-green-500 border-green-500'
                                : 'border-pink-400 dark:border-pink-600 hover:border-green-500 dark:hover:border-green-500'
                            }`}
                          >
                            {item.completed && <Check className="w-4 h-4 text-white" />}
                          </button>
                          <span
                            className={`flex-1 ${
                              item.completed
                                ? 'line-through text-gray-500 dark:text-gray-400'
                                : 'text-pink-900 dark:text-pink-100'
                            }`}
                          >
                            {item.text}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(list.id, item.id)}
                            className="text-pink-400 dark:text-pink-500 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // COMPACT PREVIEW CARD
              <div
                key={list.id}
                onClick={() => toggleListOpen(list.id)}
                className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-900 border-2 border-pink-200 dark:border-pink-700 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{list.emoji}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-pink-900 dark:text-pink-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {list.title}
                      </h3>
                      <p className="text-xs text-pink-600 dark:text-pink-400">
                        {preview.total} {preview.total === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-pink-400 dark:text-pink-600 group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Progress Bar */}
                {preview.total > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-pink-600 dark:text-pink-400 mb-1">
                      <span>{preview.completed} completed</span>
                      <span>{preview.pending} pending</span>
                    </div>
                    <div className="h-2 bg-pink-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                        style={{ width: `${preview.total > 0 ? (preview.completed / preview.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Preview Items */}
                {preview.recentItems.length > 0 ? (
                  <div className="space-y-1">
                    {preview.recentItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`text-sm flex items-center gap-2 ${
                          item.completed
                            ? 'text-gray-400 dark:text-gray-600 line-through'
                            : 'text-pink-800 dark:text-pink-300'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.completed ? 'bg-green-400' : 'bg-purple-400'
                        }`} />
                        <span className="truncate">{item.text}</span>
                      </div>
                    ))}
                    {preview.total > 3 && (
                      <p className="text-xs text-pink-500 dark:text-pink-500 italic mt-2">
                        +{preview.total - 3} more...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-pink-500 dark:text-pink-500 italic">
                    Empty list - click to add items
                  </p>
                )}

                {/* Completion Badge */}
                {preview.total > 0 && preview.completed === preview.total && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>All Done!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Start Tips */}
      {lists.length === 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <h4 className="text-purple-900 dark:text-purple-200 mb-2">💡 Ideas for your lists:</h4>
          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1 ml-4">
            <li>• 💃 Dance songs you want to learn choreography for</li>
            <li>• 🍳 Recipes or dishes you want to cook</li>
            <li>• 📚 Books you want to read</li>
            <li>• ✈️ Places you want to visit</li>
            <li>• 🎯 Personal goals or skills to learn</li>
            <li>• 🎬 Movies or series to watch</li>
          </ul>
        </div>
      )}
    </div>
  );
}