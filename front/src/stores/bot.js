import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export const useBotStore = defineStore('bot', () => {
  // State
  const bots = ref([])
  const selectedBot = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const showMenu = ref(false)
  const selectedBotName = ref('')
  const darkMode = ref(localStorage.getItem('darkMode') === 'true')
  const tradesStats = ref({
    count: 0,
    sum: 0,
    average: 0
  })

  // Getters
  const activeBots = computed(() => bots.value.filter(bot => bot[0]))
  const getBotById = computed(() => (id) => bots.value.find(bot => bot[1] === id))
  const totalBalance = computed(() => bots.value.reduce((sum, bot) => sum + bot[7], 0).toFixed(2))
  const totalStartBalance = computed(() => bots.value.reduce((sum, bot) => sum + bot[6], 0).toFixed(2))
  const totalProfit = computed(() => bots.value.reduce((sum, bot) => sum + bot[3], 0).toFixed(2))
  const todayProfit = computed(() => bots.value.reduce((sum, bot) => sum + bot[5], 0).toFixed(2))

  // Actions
  async function fetchBots() {
    loading.value = true
    try {
      const response = await fetch('/api/bots',{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch bot status')
      }

      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchBotStatus(botId) {
    loading.value = true
    try {
      
      const response = await fetch('/api/bot/'+String(botId),{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },

      })
      if (!response.ok) {
        throw new Error('Failed to fetch bot status')
      }
      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateBotSettings(botId, settings) {
    loading.value = true
    try {
      const response = await fetch(`/api/bots/${botId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      if (!response.ok) {
        throw new Error('Failed to update bot settings')
      }
      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetBot(botId) {
    loading.value = true
    try {
      const response = await fetch('/api/botreset/'+String(botId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to reset bot')
      }
      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function floorEdit(botId,floor) {
    loading.value = true
    try {
      const response = await fetch('/api/floor_edit/'+String(botId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body:JSON.stringify(floor)
      })
      if (!response.ok) {
        throw new Error('Failed to reset bot')
      }
      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function panicSale(botId) {
    loading.value = true
    try {
      const response = await fetch(`/api/bots/${botId}/panic-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to execute panic sale')
      }
      return await response.json()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleBot(botId, active) {
    loading.value = true
    try {
      const response = await fetch('/api/onoff/'+String(botId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          botId,
          active
        })
      })
      if (!response.ok) {
        throw new Error('Failed to toggle bot status')
      }
      await fetchBots()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteBot(botId) {
    loading.value = true
    try {
      const response = await fetch(`/api/bot/${botId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to delete bot')
      }
      await fetchBots()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createBot(botData) {
    loading.value = true
    try {
      const response = await fetch('/api/bot_create', { // Reverting to use /api/botcreate endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(botData)
      })
      if (!response.ok) {
        throw new Error('Failed to create bot')
      }
      const newBot = await response.json()
      bots.value.push(newBot) // Add the new bot to the state
      return newBot
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  function setSelectedBot(bot) {
    selectedBot.value = bot
    selectedBotName.value = bot ? bot[1] : ''
  }

  function toggleMenu() {
    showMenu.value = !showMenu.value
  }

  function setDarkMode(enabled) {
    darkMode.value = enabled
    localStorage.setItem('darkMode', enabled)
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    bots,
    selectedBot,
    loading,
    error,
    showMenu,
    selectedBotName,
    darkMode,
    tradesStats,

    // Getters
    activeBots,
    getBotById,
    totalBalance,
    totalStartBalance,
    totalProfit,
    todayProfit,

    // Actions
    fetchBots,
    fetchBotStatus,
    updateBotSettings,
    resetBot,
    panicSale,
    toggleBot,
    deleteBot,
    createBot, // Added createBot to the return statement
    setSelectedBot,
    toggleMenu,
    setDarkMode,
    clearError,
    floorEdit
  }
})
