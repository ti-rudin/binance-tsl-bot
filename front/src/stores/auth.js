import { defineStore } from 'pinia'

const ADMIN_EMAIL = 'login'
const ADMIN_PASSWORD = '1q2w!Q@W'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    status: 'out' // 'loading' | 'in' | 'out'
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userEmail: (state) => state.user?.email,
    userId: (state) => state.user?.id
  },

  actions: {
    async init() {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        this.user = JSON.parse(userData)
        this.status = 'in'
      } else {
        this.status = 'out'
      }
      this.loading = false
      return this.user
    },

    async loginWithEmail(email, password) {
      this.loading = true
      this.error = null
      
      try {
        // Simple email/password validation
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const user = {
            email: ADMIN_EMAIL,
            id: 'admin-id'
          }
          this.user = user
          this.status = 'in'
          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(user))
          return user
        } else {
          throw new Error('Неверный email или пароль')
        }
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      this.error = null
      try {
        localStorage.removeItem('user')
        this.user = null
        this.status = 'out'
      } catch (error) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})
