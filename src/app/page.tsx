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

type TabType = 'all' | 'daily' | 'monthly' | 'past-months';

export default function Home() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const totalBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Helper functions for date filtering
  const isToday = (timestamp: number) => {
    const today = new Date();
    const transactionDate = new Date(timestamp);
    return (
      today.getDate() === transactionDate.getDate() &&
      today.getMonth() === transactionDate.getMonth() &&
      today.getFullYear() === transactionDate.getFullYear()
    );
  };

  const isThisMonth = (timestamp: number) => {
    const today = new Date();
    const transactionDate = new Date(timestamp);
    return (
      today.getMonth() === transactionDate.getMonth() &&
      today.getFullYear() === transactionDate.getFullYear()
    );
  };

  const isSelectedMonth = (timestamp: number, monthYear: string) => {
    if (!monthYear) return false;
    const transactionDate = new Date(timestamp);
    const [month, year] = monthYear.split('-');
    return (
      transactionDate.getMonth() === parseInt(month) &&
      transactionDate.getFullYear() === parseInt(year)
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get all available months from transactions
  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach(t => {
      const date = new Date(t.timestamp);
      const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
      months.add(monthYear);
    });
    
    return Array.from(months).sort((a, b) => {
      const [monthA, yearA] = a.split('-').map(Number);
      const [monthB, yearB] = b.split('-').map(Number);
      return yearB - yearA || monthB - monthA; // Sort by newest first
    });
  };

  const formatMonthYear = (monthYear: string) => {
    const [month, year] = monthYear.split('-').map(Number);
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter transactions based on active tab
  const getFilteredTransactions = () => {
    switch (activeTab) {
      case 'daily':
        return transactions.filter(t => isToday(t.timestamp));
      case 'monthly':
        return transactions.filter(t => isThisMonth(t.timestamp));
      case 'past-months':
        return transactions.filter(t => isSelectedMonth(t.timestamp, selectedMonth));
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const filteredBalance = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const availableMonths = getAvailableMonths();

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

          {/* TAB NAVIGATION */}
          <div className="flex mb-4 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'all'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'daily'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'monthly'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setActiveTab('past-months')}
              className={`flex-1 py-2 px-4 text-center font-medium ${
                activeTab === 'past-months'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Past Months
            </button>
          </div>

          {/* MONTH PICKER FOR PAST MONTHS */}
          {activeTab === 'past-months' && (
            <div className="mb-4">
              <label htmlFor="monthPicker" className="block text-sm font-medium text-gray-700 mb-2">
                Select Month:
              </label>
              <select
                id="monthPicker"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Select a month...</option>
                {availableMonths.map((monthYear) => (
                  <option key={monthYear} value={monthYear}>
                    {formatMonthYear(monthYear)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* FILTERED BALANCE */}
          {activeTab !== 'all' && (
            <div className="mb-4 text-center">
              <span className="text-sm text-gray-600">
                {activeTab === 'daily' ? 'Today\'s' : 
                 activeTab === 'monthly' ? 'This Month\'s' : 
                 activeTab === 'past-months' && selectedMonth ? `${formatMonthYear(selectedMonth)}'s` : 'Selected Month\'s'} Balance:{' '}
                <span className={filteredBalance < 0 ? 'text-red-500' : 'text-green-500'}>
                  ${filteredBalance.toFixed(2)}
                </span>
              </span>
            </div>
          )}
  
          {/* TRANSACTION LIST */}
          <h2 className="font-semibold mb-2 text-xl">
            {activeTab === 'all' ? 'All Transactions:' : 
             activeTab === 'daily' ? 'Today\'s Transactions:' : 
             activeTab === 'monthly' ? 'This Month\'s Transactions:' :
             activeTab === 'past-months' && selectedMonth ? `${formatMonthYear(selectedMonth)}'s Transactions:` : 'Past Months Transactions:'}
          </h2>
          <ul className="space-y-1">
            {filteredTransactions.length === 0 ? (
              <li className="text-center text-gray-500 py-4">
                {activeTab === 'all' ? 'No transactions yet.' :
                 activeTab === 'daily' ? 'No transactions today.' : 
                 activeTab === 'monthly' ? 'No transactions this month.' :
                 activeTab === 'past-months' && selectedMonth ? `No transactions in ${formatMonthYear(selectedMonth)}.` :
                 activeTab === 'past-months' ? 'Please select a month to view transactions.' : 'No transactions found.'}
              </li>
            ) : (
              filteredTransactions.map((t) => (
                <li
                  key={t.id ?? t.timestamp}
                  className="border p-3 rounded flex justify-between items-center bg-white shadow-sm"
                >
                  <div className="flex-1">
                    <span className="block text-black font-medium">{t.title}</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(t.timestamp)} at {formatTime(t.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className={t.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount)}
                    </span>
                    {t.id && (
                      <button
                        onClick={() => handleDelete(t.id!)}
                        className="ml-3 text-red-500 hover:text-red-700 text-sm"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </li>
              ))
            )}
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