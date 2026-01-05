import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, } from 'lucide-react';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Person {
  id: string;
  name: string;
  reason: string;
  wishList: string;
  image?: string; 
}

export function PeopleSection() {
  const [userId, setUserId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newPerson, setNewPerson] = useState<Partial<Person>>({});

  /* ================= AUTH ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return () => unsub();
  }, []);

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!userId) return;

    const loadPeople = async () => {
      try {
        const snap = await getDoc(
          doc(db, 'users', userId, 'people', 'data')
        );
        if (snap.exists()) {
          setPeople(snap.data().items || []);
        }
      } catch (err) {
        console.error('Failed to load people:', err);
      }
    };

    loadPeople();
  }, [userId]);

  /* ================= SAVE ================= */

  const persist = async (items: Person[]) => {
    if (!userId) return;
    await setDoc(
      doc(db, 'users', userId, 'people', 'data'),
      { items },
      { merge: true }
    );
  };

  const savePeople = async (updated: Person[]) => {
    setPeople(updated);
    await persist(updated);
  };

  /* ================= ACTIONS ================= */

  const handleAdd = async () => {
    if (!newPerson.name?.trim()) {
      alert('Please enter a name!');
      return;
    }

    const person: Person = {
      id: Date.now().toString(),
      name: newPerson.name,
      reason: newPerson.reason || '',
      wishList: newPerson.wishList || '',
    };

    await savePeople([person, ...people]);
    setNewPerson({});
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this person from your list?')) return;
    await savePeople(people.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl text-pink-900 dark:text-pink-200 mb-2">💞 People I'd Love to Meet</h2>
        <p className="text-pink-700 dark:text-pink-400 italic">Your dream encounters...</p>
      </div>

      {/* Add Button */}
      <button
        onClick={() => setIsAdding(!isAdding)}
        className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-3 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Someone Special
      </button>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-6 space-y-4">
          <input
            type="text"
            placeholder="Name (Actor, creator, writer, anyone...)"
            value={newPerson.name || ''}
            onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900"
          />

          <textarea
            placeholder="Reason for admiration"
            value={newPerson.reason || ''}
            onChange={(e) => setNewPerson({ ...newPerson, reason: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
          />

          <textarea
            placeholder="(optional)"
            value={newPerson.wishList || ''}
            onChange={(e) => setNewPerson({ ...newPerson, wishList: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-pink-200 dark:border-purple-700 bg-white dark:bg-gray-800 text-pink-900 dark:text-pink-100 placeholder:text-pink-400 dark:placeholder:text-gray-500 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 resize-none"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-all"
            >
              Save Person
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

      {/* People List */}
      <div className="space-y-4">
        {people.length === 0 ? (
          <div className="text-center py-12 text-pink-600 dark:text-pink-400">
            <p>Your dream meeting list is empty. Who would you love to meet? ✨</p>
          </div>
        ) : (
          people.map(person => (
            <div
              key={person.id}
              className="bg-gradient-to-br from-white to-pink-50 dark:from-gray-800/50 dark:to-pink-900/20 border border-pink-200 dark:border-pink-700 rounded-lg p-5 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <h3 className="text-xl text-pink-900 dark:text-pink-200">{person.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(person.id)}
                  className="text-pink-500 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {person.reason && (
                <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-purple-900 dark:text-purple-200">
                    <span className="opacity-60">Reason for admiration:</span><br />
                    {person.reason}
                  </p>
                </div>
              )}

              {person.wishList && (
                <p className="text-pink-900 dark:text-pink-200">
                  <span className="opacity-60">Wish list:</span><br />
                  <span className="italic">{person.wishList}</span>
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}