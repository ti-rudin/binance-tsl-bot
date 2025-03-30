<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <NotificationToast 
      v-if="notificationToast.isVisible" 
      :notification-message="notificationToast.message" 
      :notification-type="notificationToast.type" 
    />
    
    <!-- Bot Header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-4">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ botName || 'Без названия' }}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          @click="toggleBot"
          :disabled="isBotActive"
          class="w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="isBotActive 
            ? 'text-gray-400 bg-gray-300 dark:bg-gray-600 cursor-not-allowed focus:ring-gray-300' 
            : 'text-white bg-green-600 hover:bg-green-500 focus:ring-green-500'"
        >
          Старт
        </button>
        
        <button
          @click="toggleBot"
          :disabled="!isBotActive"
          class="w-full px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="!isBotActive 
            ? 'text-gray-400 bg-gray-300 dark:bg-gray-600 cursor-not-allowed focus:ring-gray-300' 
            : 'text-white bg-red-600 hover:bg-red-500 focus:ring-red-500'"
        >
          Стоп
        </button>
        <button
          @click="resetBot"
          class="w-full px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-500 focus:ring-red-500 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Сброс
        </button>
      </div>
      <div class="flex items-center space-x-4 my-4">
        <span class="px-3 py-1 rounded-md text-sm font-medium" :class="statusColorClass">
          {{ currentStatus.rezhim || 'Не определен' }}
        </span>
        <span v-if="currentStatus.errmsg" class="px-3 py-1 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900 dark:text-red-200 text-red-800">
          {{ currentStatus.errmsg }}
        </span>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Column -->
      <div class="space-y-6">
        <!-- Current Status -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold mb-4 dark:text-white">Текущий статус</h2>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Текущая цена</span>
              <p class="text-lg font-medium dark:text-white">{{ formatPrice(currentStatus.currentprice) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Стартовый баланс</span>
              <p class="text-lg font-medium text-gray-600 dark:text-gray-300">{{ formatPrice(botFinance.initialDeposit) }} {{ botSettings.basecoin }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Текущий баланс</span>
              <p class="text-lg font-medium text-gray-600 dark:text-gray-300">
                {{ formatPrice(botFinance.currentDeposit) }} {{ botSettings.basecoin }}
              </p>
            </div>
            <div>
              <span class="text-sm text-gray-500 dark:text-gray-400">Прибыль / убыток</span>
              <p class="text-lg font-medium" :class="(botFinance.currentDeposit - botFinance.initialDeposit) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ formatPrice(botFinance.currentDeposit - botFinance.initialDeposit) }} {{ botSettings.basecoin }}
              </p>
            </div>
          </div>         
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-6">
        <!-- Bot Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 class="text-lg font-semibold mb-4 dark:text-white">Настройки бота</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Stop Price (% от текущей цены)</label>
              <input 
                type="number" 
                step="0.1"
                v-model.number="botSettings.offsettop" 
                @focus="pauseAutoUpdate"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Price (% от Stop Price)</label>
              <input 
                type="number" 
                step="0.1"
                v-model.number="botSettings.offsetbottom" 
                @focus="pauseAutoUpdate"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
            </div>

            <button 
              @click="saveSettings"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Сохранить настройки
            </button>

            <div class="space-y-3 mt-4">
              <button 
                @click="showDeleteConfirm"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Удалить бота
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <div v-if="showConfirmModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3 text-center">
          <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">{{ modalTitle }}</h3>
          <div class="mt-2 px-7 py-3">
            <p class="text-gray-600 dark:text-gray-300">{{ modalContent }}</p>
          </div>
          <div class="items-center px-4 py-3">
            <button 
              @click="handleModalConfirm"
              class="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Подтвердить
            </button>
            <button 
              @click="closeConfirmModal"
              class="mt-3 px-4 py-2 bg-gray-100 dark:bg-gray-600 dark:text-white text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBotStore } from '../stores/bot'
import NotificationToast from '../components/NotificationToast.vue'

const route = useRoute()
const router = useRouter()
const botStore = useBotStore()

// State
const botName = ref('')
const botSettings = ref({})
const currentStatus = ref({
  mode: '',
  errorMessage: '',
  dailyProfitPercentage: 0
})
const botFinance = ref({
  initialDeposit: 0,
  currentDeposit: 0
})
const botSales = ref({
  dailyProfitAmount: 0
})
const isBotActive = ref(false)
const lastPrice = ref(0)
const updateInterval = ref(null)
const isFieldFocused = ref(false)

// Notification
const notificationToast = ref({
  isVisible: false,
  message: '',
  type: 'success'
})

// Modal
const showConfirmModal = ref(false)
const modalTitle = ref('')
const modalContent = ref('')
const modalCallback = ref(null)

// Computed
const currentProfit = computed(() => {
  return Number(botFinance.value.currentDeposit) - Number(botFinance.value.initialDeposit)
})

const dailyProfit = computed(() => {
  return Number(botSales.value.dailyProfitAmount)
})

const statusColorClass = computed(() => {
  const status = currentStatus.value.mode
  if (!status) return 'bg-blue-100 text-blue-800'
  if (status.includes('Ошибка')) return 'bg-red-100 text-red-800'
  if (status.includes('Работает')) return 'bg-green-100 text-green-800'
  return 'bg-blue-100 text-blue-800'
})

// Methods
const formatPrice = (value) => {
  return Number(value || 0).toFixed(botSettings.value.digitprice)
}

const formatPercentage = (value) => {
  return Number(value || 0).toFixed(2)
}

const showNotification = (message, type = 'success') => {
  notificationToast.value = {
    isVisible: true,
    message,
    type
  }
  setTimeout(() => {
    notificationToast.value.isVisible = false
  }, 3000)
}

const fetchBotData = async () => {
  if (!route.query.id) {
    showNotification('ID бота не указан', 'error')
    return
  }

  try {
    const response = await botStore.fetchBotStatus(route.query.id)
    if (response) {
      console.log('Response data:', response)
      
      botName.value = response.botname || 'Без названия'
      currentStatus.value = response.status
      botSettings.value = response.settings
      botFinance.value = {
        initialDeposit: response.finance?.startdepo || 0,
        currentDeposit: response.finance?.depo || 0,

      }
      botSales.value = {
        dailyProfitAmount: response.sales?.salesTodaySum || 0
      }
      isBotActive.value = !!response.onoff
      lastPrice.value = Number(response.status?.currentprice || 0)
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    showNotification('Ошибка загрузки данных', 'error')
  }
}

const toggleBot = async () => {
  try {
    await botStore.toggleBot(route.query.id, isBotActive.value)
    showNotification(isBotActive.value ? 'Бот остановлен' : 'Бот запущен')
    await fetchBotData()
  } catch (error) {
    console.error('Ошибка переключения бота:', error)
    showNotification('Ошибка переключения бота', 'error')
  }
}

const saveSettings = async () => {
  try {
    await botStore.updateBotSettings(route.query.id, botSettings.value)
    showNotification('Настройки сохранены')
    isFieldFocused.value = false
    await fetchBotData()
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
    showNotification('Ошибка сохранения настроек', 'error')
  }
}

const resetBot = async () => {
  try {
    await botStore.resetBot(route.query.id)
    showNotification('Настройки сброшены')
    isFieldFocused.value = false
    await fetchBotData()
  } catch (error) {
    console.error('Ошибка сброса настроек:', error)
    showNotification('Ошибка сброса настроек', 'error')
  }
}

const showDeleteConfirm = () => {
  modalTitle.value = 'Подтверждение удаления'
  modalContent.value = 'Вы уверены, что хотите удалить этого бота?'
  modalCallback.value = async () => {
    try {
      await botStore.deleteBot(route.query.id)
      showNotification('Бот удален')
      router.push('/')
    } catch (error) {
      console.error('Ошибка удаления бота:', error)
      showNotification('Ошибка удаления бота', 'error')
    }
  }
  showConfirmModal.value = true
}

const handleModalConfirm = async () => {
  if (modalCallback.value) {
    await modalCallback.value()
  }
  closeConfirmModal()
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  modalCallback.value = null
}

const pauseAutoUpdate = () => {
  isFieldFocused.value = true
}

const resumeAutoUpdate = () => {
  isFieldFocused.value = false
  fetchBotData()
}

// Lifecycle
onMounted(() => {
  fetchBotData()
  updateInterval.value = setInterval(() => {
    if (!isFieldFocused.value) {
      fetchBotData()
    }
  }, 2000)
})

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>