'use client';
import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase'; // use relative path
import { collection, addDoc, getDocs } from 'firebase/firestore';

type Transaction = {
  id?: string;
  title: string;
  amount: number;
  timestamp: number;
};

export default function Home() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'transactions'));
      const data: Transaction[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Transaction, 'id'>)
      }));
      setTransactions(data);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;
    const newTransaction: Transaction = {
      title,
      amount: parseFloat(amount),
      timestamp: Date.now()
    };
    const docRef = await addDoc(collection(db, 'transactions'), newTransaction);
    setTransactions([...transactions, { ...newTransaction, id: docRef.id }]);
    setTitle('');
    setAmount('');
  };

  return (
    <main className="p-4 max-w-xl mx-auto min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center">TrackMyCash 💸</h1>

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

      <h2 className="font-semibold mb-2 text-xl">Transactions:</h2>
      <ul className="space-y-1">
        {transactions.map((t) => (
          <li
            key={t.id ?? t.timestamp}
            className="border p-2 rounded flex justify-between bg-white shadow-sm"
          >
            <span>{t.title}</span>
            <span className={t.amount < 0 ? 'text-red-600' : 'text-green-600'}>
              {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
