'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { auth, provider, db } from '../../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { query, where } from 'firebase/firestore';

type Transaction = {
  id?: string;
  title: string;
  amount: number;
  timestamp: number;
  uid: string;
};

export default function Home() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);


// ✅ Handle Google Login
const login = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  } catch (error) {
    console.error("Login error:", error);
  }
};

// ✅ Handle Logout
const logout = async () => {
  await signOut(auth);
  setUser(null);
};

// ✅ Keep user logged in on reload
useEffect(() => {
  const fetchData = async () => {
    if (!user) return;

    const q = query(collection(db, 'transactions'), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    const data: Transaction[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Transaction, 'id'>)
    }));
    setTransactions(data);
  };

  fetchData();
}, [user]); 


  // ✅ Add a transaction
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !user) return; // check for user here
    const newTransaction: Transaction = {
      title,
      amount: parseFloat(amount),
      timestamp: Date.now(),
      uid: user.uid,
    };
    const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
    setTransactions([...transactions, { ...newTransaction, id: docRef.id }]);
    setTitle('');
    setAmount('');
  };
 // ✅ Delete a transaction
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      setTransactions(transactions.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-2 text-center">TrackMyCash 💸</h1>
      <h2 className="text-xl font-semibold mb-4 text-center">
        Total Balance:{' '}
        <span className={totalBalance < 0 ? 'text-red-500' : 'text-green-500'}>
          ${totalBalance.toFixed(2)}
        </span>
      </h2>
  
      {/* ✅ Login / Logout Buttons */}
      <div className="flex justify-end mb-4">
        {user ? (
          <button onClick={logout} className="text-sm text-blue-600 hover:underline">
            Logout ({user.displayName})
          </button>
        ) : null}
      </div>
  
      {/* ✅ Conditionally show app or login message */}
      {user ? (
        <>
          {/* FORM */}
          <form onSubmit={handleSubmit} className="mb-6 space-y-2">
            <input
              className="border w-full p-2 rounded"
              placeholder="Expense Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              className="border w-full p-2 rounded"
              placeholder="Amount (use - for expense)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              className="bg-green-600 text-white w-full py-2 rounded hover:bg-green-700"
              type="submit"
            >
              Add Transaction
            </button>
          </form>
  
          {/* TRANSACTION LIST */}
          <h2 className="font-semibold mb-2 text-xl">Transactions:</h2>
          <ul className="space-y-1">
            {transactions.map((t) => (
              <li
                key={t.id ?? t.timestamp}
                className="border p-2 rounded flex justify-between items-center bg-white shadow-sm"
              >
                <div>
                  <span className="block text-black font-medium">{t.title}</span>
                  <span className={t.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                    {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}
                  </span>
                </div>
                {t.id && (
                  <button
                    onClick={() => handleDelete(t.id!)}
                    className="ml-4 text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-center mt-8">
          <button 
            onClick={login} 
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium text-lg"
          >
            Login with Google
          </button>
          <p className="text-center text-gray-500 mt-4">Please log in to view your transactions.</p>
        </div>
      )}
    </main>
  );
}