<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-800 via-black to-black text-neonYellow p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-4xl font-futuristic font-extrabold mb-2 tracking-wide">TrackMyCash 💸</h1>
      <p class="text-xl mb-6 font-light text-white">Manage your transactions with style.</p>

```
  <div v-if="user">
    <button
      @click="logout"
      class="mb-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
    >
      Logout
    </button>

    <!-- Form -->
    <form @submit.prevent="addTransaction" class="space-y-4 bg-black bg-opacity-30 p-4 rounded-lg shadow-lg">
      <input
        v-model="title"
        placeholder="Title"
        class="w-full p-3 rounded bg-black text-neonYellow placeholder-gray-400 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <input
        v-model.number="amount"
        type="number"
        placeholder="Amount"
        class="w-full p-3 rounded bg-black text-neonYellow placeholder-gray-400 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      <button
        type="submit"
        class="w-full bg-neonYellow text-black font-bold py-3 rounded hover:bg-yellow-300 transition"
      >
        Add Transaction
      </button>
    </form>

    <!-- Transaction List -->
    <h2 class="text-2xl font-semibold mt-8 mb-4">Transactions</h2>
    <ul class="space-y-2">
      <li
        v-for="t in transactions"
        :key="t.id"
        class="flex justify-between items-center bg-black bg-opacity-30 p-3 rounded shadow border border-purple-700"
      >
        <span class="font-medium">{{ t.title }}</span>
        <span :class="t.amount < 0 ? 'text-red-400' : 'text-green-400'">
          {{ t.amount < 0 ? '-' : '+' }}${{ Math.abs(t.amount) }}
        </span>
      </li>
    </ul>
  </div>

  <div v-else class="text-center mt-10 space-y-4">
    <input
      v-model="email"
      type="email"
      placeholder="Email"
      class="w-full p-3 rounded bg-black text-neonYellow placeholder-gray-400 border border-purple-500"
    />
    <input
      v-model="password"
      type="password"
      placeholder="Password"
      class="w-full p-3 rounded bg-black text-neonYellow placeholder-gray-400 border border-purple-500"
    />
    <button
      @click="login"
      class="w-full bg-neonYellow text-black font-bold py-3 rounded hover:bg-yellow-300 transition"
    >
      Login
    </button>
    <button
      @click="register"
      class="w-full bg-purple-700 text-white font-bold py-3 rounded hover:bg-purple-600 transition"
    >
      Register
    </button>
  </div>
</div>
```

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Database } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const title = ref('')
const amount = ref<number | null>(null)
const transactions = ref<Database['public']['Tables']['transactions']['Row'][]>([])

const login = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })
  if (error) {
    console.error('Login error:', error)
    alert('Login failed: ' + error.message)
  }
}

const register = async () => {
  const { error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value
  })
  if (error) {
    console.error('Sign-up error:', error)
    alert('Registration failed: ' + error.message)
  } else {
    alert('Registration successful! You may now log in.')
  }
}

const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Logout error:', error)
    alert('Logout failed: ' + error.message)
  }
}

const fetchTransactions = async () => {
  if (!user.value?.id) return

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('uid', user.value.id)

  if (error) {
    console.error('Fetch error:', error)
    return
  }

  transactions.value = data ?? []
}

const addTransaction = async () => {
  if (!title.value || amount.value === null || !user.value?.id) return

  const newTransaction: Database['public']['Tables']['transactions']['Insert'] = {
    title: title.value,
    amount: amount.value,
    timestamp: new Date().toISOString(),
    uid: user.value.id
  }

  const { error } = await supabase.from('transactions').insert([newTransaction])

  if (error) {
    console.error('Insert error:', error)
    return
  }

  title.value = ''
  amount.value = null
  await fetchTransactions()
}

watch(user, (newUser) => {
  if (newUser?.id) {
    fetchTransactions()
  } else {
    transactions.value = []
  }
})

onMounted(fetchTransactions)
</script>
