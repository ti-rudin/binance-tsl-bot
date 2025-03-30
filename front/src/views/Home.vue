<template>
  <div class="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <!-- Balance Statistics -->
    <div class="grid grid-cols-1 gap-6 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4 dark:text-white">Баланс</h2>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400">Старт</h3>
            <p class="text-xl font-semibold dark:text-white">{{ totalStartBalance }} USDT</p>
          </div>
          <div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400">Текущий</h3>
            <p class="text-xl font-semibold dark:text-white">{{ totalBalance }} USDT</p>
          </div>
          <div>
            <h3 class="text-sm text-gray-500 dark:text-gray-400">Сальдо</h3>
            <p class="text-xl font-semibold"
              :class="totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ totalProfit }} USDT
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bots List -->
    <div class="grid grid-cols-1 gap-6">
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 class="text-xl font-bold dark:text-white">Мои боты</h2>
      <button
        class="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
        @click="$router.push('/newbot')">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6">
          </path>
        </svg>
        Новый бот
      </button>
    </div>
    <div class="p-6">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li v-for="item in bots" :key="item[8]" @click="viewBot(item[1])"
          class="py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
          <div class="space-y-2">
            <!-- Первая строка - только имя -->
            <div class="font-bold text-md dark:text-white">{{ item[1] }}</div>
            
            <!-- Вторая строка - остальные данные -->
            <div class="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div class="flex items-center text-xl font-semibold">
            
                <span>{{ item[6] }}</span>
              </div>
              <div class="flex items-center text-xl font-semibold">
              
                <span>{{ item[7] }}</span>
              </div>
              <div class="flex items-center text-xl font-semibold">
            
                <span :class="item[8] >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ item[8] }}
                </span>
              </div>
            </div>
          </div>
        </li>
        <li v-if="!bots.length" class="py-8 text-center text-gray-500 dark:text-gray-400">
          Ни одного бота не создано
        </li>
      </ul>
    </div>
  </div>
</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { useBotStore } from '../stores/bot'

const botStore = useBotStore()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const bots = ref([])
let fetchInterval = null

// Computed values
const totalBalance = computed(() => {
  return bots.value.reduce((sum, bot) => sum + Number(bot[7] || 0), 0).toFixed(2)
})

const totalStartBalance = computed(() => {
  return bots.value.reduce((sum, bot) => sum + Number(bot[6] || 0), 0).toFixed(2)
})

const totalProfit = computed(() => {
  return bots.value.reduce((sum, bot) => sum + Number(bot[8] || 0), 0).toFixed(2)
})

const todayProfit = computed(() => {
  return bots.value.reduce((sum, bot) => sum + Number(bot[5] || 0), 0).toFixed(2)
})

const investmentPercent = computed(() => {
  const total = bots.value.reduce((sum, bot) => sum + Number(bot[10] || 0), 0)
  const start = bots.value.reduce((sum, bot) => sum + Number(bot[6] || 0), 0)
  return start ? Number(((total / start) * 100).toFixed(2)) : 0
})

// Methods
const fetchBots = async () => {


  loading.value = true
  try {
    const response = await botStore.fetchBots()
    if (response) {

      bots.value = response
    }

  } catch (error) {
    console.error('Failed to fetch bots:', error)
  } finally {
    loading.value = false
  }
}

const viewBot = (botId) => {
  router.push(`/botstatuspage?id=${botId}`)
}

const debounce = (func, delay) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

const debouncedFetchBots = debounce(fetchBots, 300)

onMounted(() => {
  fetchBots()
  fetchInterval = setInterval(debouncedFetchBots, 1000)
})

onUnmounted(() => {
  if (fetchInterval) {
    clearInterval(fetchInterval)
  }
})
</script>

<style scoped>
.progress {
  appearance: none;
  height: 0.5rem;
  border-radius: 9999px;
  overflow: hidden;
}

.progress::-webkit-progress-bar {
  background-color: #e5e7eb;
  border-radius: 9999px;
}

.progress::-webkit-progress-value {
  border-radius: 9999px;
}

.progress-success::-webkit-progress-value {
  background-color: #10b981;
}

.progress-warning::-webkit-progress-value {
  background-color: #f59e0b;
}

.dark .progress::-webkit-progress-bar {
  background-color: #374151;
}

.dark .progress-success::-webkit-progress-value {
  background-color: #34d399;
}

.dark .progress-warning::-webkit-progress-value {
  background-color: #fbbf24;
}
</style>