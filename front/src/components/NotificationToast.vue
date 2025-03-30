<template>
  <div v-if="isVisible" class="fixed bottom-4 right-4 z-50">
    <Transition name="fade">
      <div 
        class="px-6 py-4 rounded-md shadow-lg text-white" 
        :class="notificationTypeClasses"
      >
        {{ notificationMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  notificationMessage: String,
  notificationType: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'info'].includes(value)
  },
  notificationDuration: {
    type: Number,
    default: 3000
  }
})

const isVisible = ref(false)

const notificationTypeClasses = computed(() => {
  return {
    'success': 'bg-green-500',
    'error': 'bg-red-500',
    'info': 'bg-blue-500'
  }[props.notificationType]
})

onMounted(() => {
  isVisible.value = true
  setTimeout(() => {
    isVisible.value = false
  }, props.notificationDuration)
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