<template>
  <div class="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-2xl font-bold mb-6 dark:text-white">Создание нового бота</h2>

      <!-- Toast Notification -->
      <div v-if="notification.show"
        :class="`fixed top-4 right-4 flex items-center w-full max-w-xs p-4 mb-4 rounded-lg shadow ${notification.type === 'success' 
          ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-200' 
          : 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200'}`"
        role="alert">
        <div
          :class="`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${notification.type === 'success' 
            ? 'bg-green-200 dark:bg-green-600 text-green-600 dark:text-green-100' 
            : 'bg-red-200 dark:bg-red-600 text-red-600 dark:text-red-100'}`">
          <svg v-if="notification.type === 'success'" class="w-5 h-5" aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
          <svg v-else class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor"
            viewBox="0 0 20 20">
            <path
              d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
          </svg>
        </div>
        <div class="ml-3 text-sm font-normal">{{ notification.message }}</div>
        <button @click="closeNotification" type="button"
          class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700"
          data-dismiss-target="#toast-success" aria-label="Close">
          <span class="sr-only">Закрыть</span>
          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="onFinish" class="space-y-6">
        <!-- Trading Pair Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Выберите торговую пару *</label>
          <input type="text" v-model="searchQuery" placeholder="Поиск по символу"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" />
          <select v-model="selectedPair" @change="onPairSelect"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="" disabled>Выберите торговую пару</option>
            <option v-for="pair in filteredTradingPairs" :key="pair.symbol" :value="pair.symbol">{{ pair.symbol }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Отступ снизу, % *</label>
            <input type="number" v-model="formState.offsetBottom" required min="0" step="0.001"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Отступ сверху, % *</label>
            <input type="number" v-model="formState.offsetTop" required min="0" step="0.001"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
        </div>

        <!-- Submit Button -->
        <button type="submit" :disabled="loading"
          class="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600">
          {{ loading ? 'Создание...' : 'Создать бота' }}
        </button>
      </form>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useBotStore } from '../stores/bot'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const botStore = useBotStore()
const authStore = useAuthStore()
const loading = ref(false)

// Notification state
const notification = reactive({
  show: false,
  type: 'success',
  message: '',
  timeout: null
})

const showNotification = (type, message) => {
  if (notification.timeout) {
    clearTimeout(notification.timeout)
  }
  notification.show = true
  notification.type = type
  notification.message = message
  notification.timeout = setTimeout(() => {
    notification.show = false
  }, 3000)
}

const closeNotification = () => {
  notification.show = false
  if (notification.timeout) {
    clearTimeout(notification.timeout)
  }
}

const tradingPairs = ref([]) // To store fetched trading pairs
const searchQuery = ref('') // To store the search input
const selectedPair = ref('') // To store the selected trading pair

const filteredTradingPairs = computed(() => {
  return tradingPairs.value.filter(pair =>
    pair.symbol.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const formState = reactive({

  quotaCoin: '',
  baseCoin: '',
  startDepo: 0,
  offsetBottom: 0.05,
  offsetTop: 0.5,

  ticksize: 0, // Add ticksize to formState

})

const fetchTradingPairs = async () => {
  try {
    const response = await fetch('/binance');
    const data = await response.json();
    //console.log('API Response:', data); // Log the full API response
    tradingPairs.value = data.symbols.map(symbol => {
      const baseAsset = symbol.quoteAsset; // Extract baseAsset
      const quoteAsset = symbol.baseAsset; // Extract quoteAsset
      const priceFilter = symbol.filters.find(filter => filter.filterType === 'PRICE_FILTER');
      const lotSizeFilter = symbol.filters.find(filter => filter.filterType === 'LOT_SIZE');
      //console.log('Mapping symbol:', symbol.symbol); // Log each symbol being mapped
      return {
        symbol: symbol.symbol,
        tickSize: priceFilter ? priceFilter.tickSize : null,
        stepSize: lotSizeFilter ? lotSizeFilter.stepSize : null,
        baseAsset: baseAsset, // Include baseAsset
        quoteAsset: quoteAsset // Include quoteAsset
      };
    });
  } catch (error) {
    console.error('Error fetching trading pairs:', error);
  }
}

const onPairSelect = () => {
  const selected = tradingPairs.value.find(pair => pair.symbol === selectedPair.value);
  if (selected) {
    console.log(selected)
    formState.tickSize = selected.tickSize; // Store tickSize in formState
    formState.baseCoin = selected.baseAsset; // Set baseCoin directly from selected object
    formState.quotaCoin = selected.quoteAsset; // Set quotaCoin directly from selected object
    formState.stepSize = selected.stepSize;
    formState.digitQ = countSignificantDecimalPlaces(selected.stepSize);
    formState.digitPrice = countSignificantDecimalPlaces(selected.tickSize)
  }
}

// Call fetchTradingPairs when the component is mounted
fetchTradingPairs();

const orderSizeInQuota = computed(() => {
  if (!formState.startDepo || !formState.orderSize || !formState.minPrice) return 0
  return ((formState.startDepo * formState.orderSize / 100) / formState.minPrice).toFixed(formState.digitQ)
})

const orderSizeInBase = computed(() => {
  if (!formState.startDepo || !formState.orderSize) return 0
  return (formState.startDepo * formState.orderSize / 100).toFixed(formState.digitQ)
})

const offsetBottomSize = computed(() => {
  if (!formState.minPrice || !formState.offsetBottom) return 0
  return ((formState.minPrice * formState.offsetBottom) / 100).toFixed(formState.digitPrice)
})

const offsetTopSize = computed(() => {
  if (!formState.minPrice || !formState.offsetTop || !formState.profitProc) return 0
  const priceWithProfit = formState.minPrice * (1 + formState.profitProc / 100)
  return ((priceWithProfit * formState.offsetTop) / 100).toFixed(formState.digitPrice)
})

function countSignificantDecimalPlaces(numberString) {
  // Проверяем, содержит ли строка точку
  if (numberString.includes('.')) {
    // Разделяем строку на две части: до и после точки
    const parts = numberString.split('.');
    // Удаляем нули в конце части после точки
    const significantPart = parts[1].replace(/0+$/, '');
    // Возвращаем длину значащей части после точки
    return significantPart.length;
  } else {
    // Если точки нет, значит, нет знаков после запятой
    return 0;
  }
}

const onFinish = async () => {
  loading.value = true
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const botName = `${formState.quotaCoin}${formState.baseCoin}-${timestamp}`

    const botData = {
      botname: botName,
      busy: false,
      onoff: false,
      settings: {

        quotacoin: formState.quotaCoin,
        basecoin: formState.baseCoin,

        startdepo: 0,

        offsetbottom: formState.offsetBottom,
        offsettop: formState.offsetTop,
        digitprice: formState.digitPrice,
        digitq: formState.digitQ,
        stepsize: formState.stepSize,
        ticksize: formState.tickSize,
        exchange: "Binance",
      },
      finance: {
        startdepo: 0,
        depo: 0,
        quotanal: 0,
        quotainorders: 0,
        basenal: 0,
        baseinorders: 0,
        profityoday: 0,
      },
      sales: { today: [], days: [], all: [] },
      status: {
        currentprice: 0,
        lastprice: -1,
        rezhim: 'Стартовые настройки',
        updated: -1
      },
      tsl: {
        raschstopprice: 0,
        curstop: 0,
        curorderid: 0,
        quantity: 0,
        filledquantity: 0,
        sold: false,
        state: '0',
        busy: false
      },
      openpos: {
        quantity: 0,
      }
    }

    //botData.settings = JSON.stringify(botData.settings)
    await botStore.createBot(botData)
    showNotification('success', 'Бот успешно создан')
    router.push('/')
  } catch (error) {
    showNotification('error', 'Ошибка при создании бота')
    console.error('Failed to create bot:', error)
  } finally {
    loading.value = false
  }
}
</script>
