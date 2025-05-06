<template>
  <div class="min-h-screen bg-gradient-to-b from-purple-800 via-black to-black text-neonYellow p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-4xl font-futuristic font-extrabold mb-2 tracking-wide">TrackMyCash 💸</h1>
      <p class="text-xl mb-6 font-light text-white">Manage your transactions with style.</p>

      <div v-if="user">
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

      <div v-else class="text-center mt-10">
        <button
          @click="login"
          class="bg-neonYellow text-black font-bold px-6 py-3 rounded hover:bg-yellow-300 transition"
        >
          Login with Google
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { $supabase } = useNuxtApp()
import { SupabaseClient } from '@supabase/supabase-js'

const supabase = $supabase as SupabaseClient

const user = ref<any>(null)
const title = ref('')
const amount = ref<number | null>(null)
const transactions = ref<{ id: number; title: string; amount: number }[]>([])

const login = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        prompt: 'select_account'
      }
    }
  })
  if (error) console.error('Login error:', error)
}


const fetchUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    console.error('User fetch error:', error)
    return
  }
  user.value = data.user
}

const fetchTransactions = async () => {
  if (!user.value) return
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('uid', user.value.id)
  if (error) {
    console.error('Fetch error:', error)
  }
  transactions.value = data ?? []
}

const addTransaction = async () => {
  if (!title.value || !amount.value || !user.value) return
  const { error } = await supabase.from('transactions').insert({
    title: title.value,
    amount: amount.value,
    timestamp: Date.now(),
    uid: user.value.id
  })
  if (!error) {
    title.value = ''
    amount.value = null
    fetchTransactions()
  }
}

onMounted(async () => {
  await fetchUser()
  await fetchTransactions()
})
</script>
