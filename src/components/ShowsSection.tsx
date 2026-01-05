import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Search, Film, Heart, Clock, Edit2 ,Eye } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Show {
  id: string;
  title: string;
  category: 'watched' | 'favorite' | 'wantToWatch';
  rating?: number;
  review?: string;
  favoriteCharacter?: string;
  genre?: string;
  yearWatched?: string;
  whyFavorite?: string;
  favCharacter?: string;
  memorableMoment?: string;
  rewatchCount?: string;
}

export function ShowsSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeTab, setActiveTab] =
    useState<'watched' | 'favorite' | 'wantToWatch'>('watched');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
    const [watchedSortBy, setWatchedSortBy] = useState<'latest' | 'highRated' | 'leastRated'>('latest');


  const [newShow, setNewShow] = useState<Partial<Show>>({
    title: '',
    rating: 5,
    category: 'watched',
  });

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setUserId(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!userId) return;

    const loadShows = async () => {
      try {
        const snap = await getDoc(
          doc(db, 'users', userId, 'shows', 'data')
        );
        if (snap.exists()) {
          setShows(snap.data().items || []);
        }
      } catch (e) {
        console.error('Failed to load shows:', e);
      }
    };

    loadShows();
  }, [userId]);

  /* ================= SAVE ================= */

  const persist = async (items: Show[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, 'users', userId, 'shows', 'data'),
      { items },
      { merge: true }
    );
  };

  const saveShows = async (updated: Show[]) => {
    setShows(updated);
    await persist(updated);
  };

  /* ================= ACTIONS ================= */

  const handleAddShow = async () => {
    if (!newShow.title?.trim()) {
      alert('Please enter a show title!');
      return;
    }

    if (editingId) {
      const updated = shows.map(s =>
        s.id === editingId ? { ...s, ...newShow, id: s.id } as Show : s
      );
      await saveShows(updated);
      setEditingId(null);
    } else {
      const show: Show = {
        id: Date.now().toString(),
        ...newShow,
        category: activeTab,
      } as Show;

      await saveShows([...shows, show]);
    }

    setNewShow({
      title: '',
      rating: 5,
      category: activeTab,
    });
    setIsAdding(false);
  };

  const handleEdit = (show: Show) => {
    setNewShow(show);
    setEditingId(show.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this show?')) return;
    await saveShows(shows.filter(s => s.id !== id));
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewShow({
      title: '',
      rating: 5,
      category: activeTab,
    });
  };

  /* ================= FILTERS ================= */

  const filteredShows = shows
    .filter(s => s.category === activeTab)
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(query) ||
        s.review?.toLowerCase().includes(query) ||
        s.favoriteCharacter?.toLowerCase().includes(query) ||
        s.whyFavorite?.toLowerCase().includes(query) ||
        s.favCharacter?.toLowerCase().includes(query) ||
        s.genre?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      // Apply sorting only for watched tab
      if (activeTab === 'watched') {
        if (watchedSortBy === 'highRated') {
          return (b.rating || 0) - (a.rating || 0);
        } else if (watchedSortBy === 'leastRated') {
          return (a.rating || 0) - (b.rating || 0);
        } else if (watchedSortBy === 'latest') {
          return parseInt(b.id) - parseInt(a.id);
        }
      }
      return 0;
    });







  const globalFilteredShows = shows.filter(s => {
    if (!globalSearch.trim()) return false;
    const q = globalSearch.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.review?.toLowerCase().includes(q) ||
      s.favoriteCharacter?.toLowerCase().includes(q) ||
      s.whyFavorite?.toLowerCase().includes(q) ||
      s.favCharacter?.toLowerCase().includes(q) ||
      s.memorableMoment?.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q) ||
      s.yearWatched?.toLowerCase().includes(q)
    );
  });

  const getCategoryLabel = (c: Show['category']) =>
    c === 'watched' ? 'Watched' : c === 'favorite' ? 'Favorite' : 'Want to Watch';
  const handleAdd = handleAddShow;


  /* ================= UI BELOW (UNCHANGED) ================= */



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-pink-200 mb-2">🎬 Shows and Movies</h2>
        <p className="text-pink-700 dark:text-pink-400 italic">Your entertainment journey...</p>
      </div>

      {/* Global Search Bar */}
      {shows.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-purple-500 dark:text-purple-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="🔍 Search across all shows and movies..."
            className="w-full pl-14 pr-4 py-4 rounded-xl border-2 border-purple-300 dark:border-purple-600 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 text-pink-900 dark:text-purple-100 placeholder:text-purple-500 dark:placeholder:text-purple-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:focus:ring-purple-800 shadow-md"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Global Search Results */}
      {globalSearch.trim() && globalFilteredShows.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl text-purple-900 dark:text-purple-200">
              🔍 Found {globalFilteredShows.length} {globalFilteredShows.length === 1 ? 'result' : 'results'}
            </h3>
            <button
              onClick={() => setGlobalSearch('')}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              Clear search
            </button>
          </div>
          
          <div className="space-y-3">
            {globalFilteredShows.map((show) => (
              <div
                key={show.id}
                className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-4 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg text-pink-900 dark:text-pink-200">{show.title}</h4>
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        {getCategoryLabel(show.category)}
                      </span>
                    </div>
                    {show.category === 'watched' && show.rating && (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            className={`w-4 h-4 ${
                              rating <= (show.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-pink-700 dark:text-pink-300 ml-1">
                          ({show.rating}/5)
                        </span>
                      </div>
                    )}
                    {show.genre && (
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {show.genre}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveTab(show.category);
                        setGlobalSearch('');
                        handleEdit(show);
                      }}
                      className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(show.id)}
                      className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {show.review && (
                  <p className="text-sm text-pink-800 dark:text-pink-300 mt-2 line-clamp-2 italic">
                    "{show.review}"
                  </p>
                )}
                {show.whyFavorite && (
                  <p className="text-sm text-pink-800 dark:text-pink-300 mt-2 line-clamp-2 italic">
                    "{show.whyFavorite}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {globalSearch.trim() && globalFilteredShows.length === 0 && (
        <div className="text-center py-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700">
          <p className="text-purple-600 dark:text-purple-400">
            No shows found matching "{globalSearch}" 😔
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => {
            setActiveTab('watched');
            setIsAdding(false);
            setEditingId(null);
          }}
          className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'watched'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
              : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
          }`}
        >
          <Film className="w-5 h-5" />
          Watched
          {shows.filter(s => s.category === 'watched').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 text-xs">
              {shows.filter(s => s.category === 'watched').length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('favorite');
            setIsAdding(false);
            setEditingId(null);
          }}
          className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'favorite'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
              : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
          }`}
        >
          <Heart className="w-5 h-5" />
          Favorite
          {shows.filter(s => s.category === 'favorite').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 text-xs">
              {shows.filter(s => s.category === 'favorite').length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('wantToWatch');
            setIsAdding(false);
            setEditingId(null);
          }}
          className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'wantToWatch'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105'
              : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
          }`}
        >
          <Clock className="w-5 h-5" />
          Want to Watch
          {shows.filter(s => s.category === 'wantToWatch').length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/30 text-xs">
              {shows.filter(s => s.category === 'wantToWatch').length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      {shows.filter(s => s.category === activeTab).length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-pink-400 dark:text-purple-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${activeTab === 'watched' ? 'Watched' : activeTab === 'favorite' ? 'Favorite' : 'Want to Watch'}...`}
            className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-purple-100 placeholder:text-pink-400 dark:placeholder:text-purple-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
          />
        </div>
      )}

      {/* Sorting Options for Watched Tab */}
      {activeTab === 'watched' && shows.filter(s => s.category === 'watched').length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setWatchedSortBy('latest')}
            className={`px-4 py-2 rounded-lg transition-all text-sm ${
              watchedSortBy === 'latest'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
            }`}
          >
            ⏰ Latest Added
          </button>
          <button
            onClick={() => setWatchedSortBy('highRated')}
            className={`px-4 py-2 rounded-lg transition-all text-sm ${
              watchedSortBy === 'highRated'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
            }`}
          >
            ⭐ High Rated
          </button>
          <button
            onClick={() => setWatchedSortBy('leastRated')}
            className={`px-4 py-2 rounded-lg transition-all text-sm ${
              watchedSortBy === 'leastRated'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-pink-100 dark:bg-gray-800 text-pink-900 dark:text-pink-200 hover:bg-pink-200 dark:hover:bg-gray-700'
            }`}
          >
            📉 Least Rated
          </button>
        </div>
      )}

      {/* Add Button */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add to {activeTab === 'watched' ? 'Watched' : activeTab === 'favorite' ? 'Favorite' : 'Want to Watch'}
      </button>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 border-2 border-pink-200 dark:border-pink-700 rounded-xl p-6 space-y-4">
          <h3 className="text-xl text-pink-900 dark:text-pink-200 mb-4">
            {editingId ? 'Edit' : 'Add'} {activeTab === 'watched' ? 'Watched Show' : activeTab === 'favorite' ? 'Favorite Show' : 'Show to Watch'}
          </h3>

          {/* Common Field - Title */}
          <div>
            <label className="block text-pink-900 dark:text-pink-200 mb-2">Show/Movie Title *</label>
            <input
              type="text"
              placeholder="Enter title"
              value={newShow.title || ''}
              onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {/* WATCHED SECTION FIELDS */}
          {activeTab === 'watched' && (
            <>
              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Rating *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewShow({ ...newShow, rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-all ${
                          rating <= (newShow.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600'
                        } hover:scale-110`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-pink-900 dark:text-pink-200">{newShow.rating}/5</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-pink-900 dark:text-pink-200 mb-2">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g., Romance, Action, Comedy"
                    value={newShow.genre || ''}
                    onChange={(e) => setNewShow({ ...newShow, genre: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>

                <div>
                  <label className="block text-pink-900 dark:text-pink-200 mb-2">Year Watched</label>
                  <input
                    type="text"
                    placeholder="e.g., 2024"
                    value={newShow.yearWatched || ''}
                    onChange={(e) => setNewShow({ ...newShow, yearWatched: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Favorite Character</label>
                <input
                  type="text"
                  placeholder="Who was your favorite character?"
                  value={newShow.favoriteCharacter || ''}
                  onChange={(e) => setNewShow({ ...newShow, favoriteCharacter: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Your Review / Thoughts</label>
                <textarea
                  placeholder="What did you think? What made it special? Would you recommend it?"
                  value={newShow.review || ''}
                  onChange={(e) => setNewShow({ ...newShow, review: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                />
              </div>
            </>
          )}

          {/* FAVORITE SECTION FIELDS */}
          {activeTab === 'favorite' && (
            <>
              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Why is this your favorite? *</label>
                <textarea
                  placeholder="What makes this show/movie so special to you? Why do you love it?"
                  value={newShow.whyFavorite || ''}
                  onChange={(e) => setNewShow({ ...newShow, whyFavorite: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Favorite Character</label>
                <input
                  type="text"
                  placeholder="Your most beloved character from this show"
                  value={newShow.favCharacter || ''}
                  onChange={(e) => setNewShow({ ...newShow, favCharacter: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">Most Memorable Moment</label>
                <textarea
                  placeholder="That scene you can't forget... that moment that made you cry or laugh..."
                  value={newShow.memorableMoment || ''}
                  onChange={(e) => setNewShow({ ...newShow, memorableMoment: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 resize-none"
                />
              </div>

              <div>
                <label className="block text-pink-900 dark:text-pink-200 mb-2">How many times have you rewatched?</label>
                <input
                  type="text"
                  placeholder="e.g., 3 times, countless times"
                  value={newShow.rewatchCount || ''}
                  onChange={(e) => setNewShow({ ...newShow, rewatchCount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-900 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddShow}
              className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-all"
            >
              {editingId ? 'Update' : 'Save'} Show
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-pink-200 dark:bg-gray-700 text-pink-900 dark:text-pink-200 py-3 rounded-lg hover:bg-pink-300 dark:hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shows List */}
      <div className="space-y-4">
        {filteredShows.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border-2 border-dashed border-pink-300 dark:border-pink-700">
            <p className="text-pink-600 dark:text-pink-400 mb-2">
              {searchQuery.trim() 
                ? 'No shows found matching your search.' 
                : `No shows in ${activeTab === 'watched' ? 'Watched' : activeTab === 'favorite' ? 'Favorite' : 'Want to Watch'} yet.`}
            </p>
            <p className="text-pink-500 dark:text-pink-500 text-sm">
              Add your first one! ✨
            </p>
          </div>
        ) : (
          filteredShows.map((show) => (
            <div
              key={show.id}
              className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-900 border-2 border-pink-200 dark:border-pink-700 rounded-xl p-6 hover:shadow-lg transition-all"
            >
              {/* WATCHED SHOW DISPLAY */}
              {activeTab === 'watched' && (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl text-pink-900 dark:text-pink-200 mb-2">{show.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            className={`w-5 h-5 ${
                              rating <= (show.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-300 dark:fill-gray-600 text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-pink-700 dark:text-pink-300 ml-1">
                          ({show.rating}/5)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-pink-600 dark:text-pink-400">
                        {show.genre && (
                          <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 rounded-full">
                            {show.genre}
                          </span>
                        )}
                        {show.yearWatched && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            {show.yearWatched}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(show)}
                        className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(show.id)}
                        className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {show.favoriteCharacter && (
                    <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        <strong>Favorite Character:</strong> {show.favoriteCharacter}
                      </p>
                    </div>
                  )}

                  {show.review && (
                    <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-100 dark:border-pink-800">
                      <p className="text-pink-900 dark:text-pink-100 italic">"{show.review}"</p>
                    </div>
                  )}
                </>
              )}

              {/* FAVORITE SHOW DISPLAY */}
              {activeTab === 'favorite' && (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl text-pink-900 dark:text-pink-200 flex items-center gap-2">
                      💖 {show.title}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(show)}
                        className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(show.id)}
                        className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {show.whyFavorite && (
                    <div className="mb-3 p-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                      <p className="text-sm text-pink-700 dark:text-pink-300 mb-1">
                        <strong>Why it's my favorite:</strong>
                      </p>
                      <p className="text-pink-900 dark:text-pink-100 italic">"{show.whyFavorite}"</p>
                    </div>
                  )}

                  {show.favCharacter && (
                    <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        <strong>Favorite Character:</strong> {show.favCharacter}
                      </p>
                    </div>
                  )}

                  {show.memorableMoment && (
                    <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">
                        <strong>Most Memorable Moment:</strong>
                      </p>
                      <p className="text-blue-900 dark:text-blue-100 italic">"{show.memorableMoment}"</p>
                    </div>
                  )}

                  {show.rewatchCount && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Rewatched:</strong> {show.rewatchCount}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* WANT TO WATCH DISPLAY */}
              {activeTab === 'wantToWatch' && (
                <div className="flex justify-between items-center">
                  <h3 className="text-xl text-pink-900 dark:text-pink-200 flex items-center gap-2">
                    ⏳ {show.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(show)}
                      className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(show.id)}
                      className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}