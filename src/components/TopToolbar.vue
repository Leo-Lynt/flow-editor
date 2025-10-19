<template>
  <div class="h-12 bg-flow-surface dark:bg-flow-surface-dark border-b border-flow-border dark:border-flow-border-dark flex items-center justify-between px-4 relative z-[100] backdrop-blur-sm">
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-3 px-2">
        <FlowIcon icon="material-symbols:hub" :size="24" :color="'#6366f1'" />
        <span class="text-lg font-bold text-flow-text dark:text-flow-text-dark tracking-tight">FlowForge</span>
      </div>
    </div>

    <div class="flex items-center gap-2 flex-1 justify-center">
      <div class="flex items-center gap-1">
        <button
          @click="handleExecuteClick"
          class="inline-flex items-center gap-1.5 px-4 py-2 bg-primary border border-primary rounded-lg text-white text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-primary-hover hover:border-primary-hover hover:shadow-lg hover:scale-105 active:scale-95"
        >
          <FlowIcon icon="material-symbols:play-arrow" :size="16" />
          Execute
        </button>
      </div>

      <div class="w-px h-6 bg-flow-border dark:bg-flow-border-dark mx-3 opacity-50"></div>

      <div class="flex items-center gap-1">
        <button
          @click="$emit('undo')"
          class="inline-flex items-center gap-1.5 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium cursor-pointer transition-all hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:border-border-hover-light dark:hover:border-border-hover-dark disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
          :disabled="!canUndo"
        >
          <FlowIcon icon="material-symbols:undo" :size="16" />
        </button>
        <button
          @click="$emit('redo')"
          class="inline-flex items-center gap-1.5 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium cursor-pointer transition-all hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:border-border-hover-light dark:hover:border-border-hover-dark disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
          :disabled="!canRedo"
        >
          <FlowIcon icon="material-symbols:redo" :size="16" />
        </button>
      </div>

      <div class="w-px h-6 bg-border-light dark:bg-border-dark mx-2"></div>

      <div class="flex items-center gap-1">
        <button
          @click="$emit('clear')"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md text-error text-sm font-medium cursor-pointer transition-all hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:border-border-hover-light dark:hover:border-border-hover-dark"
          title="Clear Flow"
        >
          <FlowIcon icon="material-symbols:clear-all" :size="16" />
          Clear
        </button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- 🚀 Botão de Save Manual (movido para direita) -->
      <button
        @click="handleSaveClick"
        :disabled="!hasUnsavedChanges || syncStatus === 'syncing'"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
        :class="{
          'bg-primary border border-primary text-white hover:bg-primary-hover hover:shadow-lg cursor-pointer': hasUnsavedChanges && syncStatus !== 'syncing',
          'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark cursor-not-allowed opacity-50': !hasUnsavedChanges || syncStatus === 'syncing'
        }"
        :title="saveButtonTooltip"
      >
        <FlowIcon
          :icon="syncStatus === 'syncing' ? 'material-symbols:sync' : 'material-symbols:save'"
          :size="16"
          :class="{ 'animate-spin': syncStatus === 'syncing' }"
        />
        {{ saveButtonText }}
      </button>

      <div class="w-px h-6 bg-flow-border dark:bg-flow-border-dark mx-2 opacity-50"></div>


      <!-- Sync Status Indicator -->
      <div
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
        :class="{
          'bg-yellow-50 dark:bg-yellow-900/20': hasUnsavedChanges && syncStatus !== 'syncing',
          'bg-green-50 dark:bg-green-900/20': !hasUnsavedChanges && syncStatus === 'synced',
          'bg-blue-50 dark:bg-blue-900/20': syncStatus === 'syncing',
          'bg-red-50 dark:bg-red-900/20': syncStatus === 'error',
          'bg-gray-50 dark:bg-gray-900/20': syncStatus === 'offline'
        }"
        :title="syncTooltip"
      >
        <FlowIcon
          :icon="syncIcon"
          :size="14"
          :class="{
            'text-yellow-600 dark:text-yellow-400': hasUnsavedChanges && syncStatus !== 'syncing',
            'text-green-600 dark:text-green-400': !hasUnsavedChanges && syncStatus === 'synced',
            'text-blue-600 dark:text-blue-400 animate-spin': syncStatus === 'syncing',
            'text-red-600 dark:text-red-400': syncStatus === 'error',
            'text-gray-600 dark:text-gray-400': syncStatus === 'offline'
          }"
        />
        <span class="text-xs font-medium" :class="{
          'text-yellow-700 dark:text-yellow-300': hasUnsavedChanges && syncStatus !== 'syncing',
          'text-green-700 dark:text-green-300': !hasUnsavedChanges && syncStatus === 'synced',
          'text-blue-700 dark:text-blue-300': syncStatus === 'syncing',
          'text-red-700 dark:text-red-300': syncStatus === 'error',
          'text-gray-700 dark:text-gray-300': syncStatus === 'offline'
        }">{{ syncText }}</span>
      </div>

      <div
        class="flex items-center gap-1.5 px-3 py-1 bg-surface-hover-light dark:bg-surface-hover-dark rounded-2xl"
        v-if="executionStatus"
      >
        <div
          class="w-2 h-2 rounded-full"
          :class="{
            'bg-gray-400': !executionStatus,
            'bg-warning animate-pulse': executionStatus === 'running',
            'bg-success': executionStatus === 'success',
            'bg-error': executionStatus === 'error'
          }"
        ></div>
        <span class="text-xs text-text-muted-light dark:text-text-muted-dark font-medium">{{ statusText }}</span>
      </div>

      <button
        @click="toggleTheme"
        class="inline-flex items-center gap-1.5 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium cursor-pointer transition-all hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:border-border-hover-light dark:hover:border-border-hover-dark"
        :title="`Switch to ${isDark ? 'light' : 'dark'} mode`"
      >
        <FlowIcon :icon="isDark ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'" :size="16" />
      </button>

      <button
        @click="$emit('toggleHelp')"
        class="inline-flex items-center gap-1.5 px-2 py-1.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium cursor-pointer transition-all hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark hover:border-border-hover-light dark:hover:border-border-hover-dark"
        title="Help"
      >
        <FlowIcon icon="material-symbols:help" :size="16" />
      </button>

      <div class="ml-2 relative" ref="userMenuRef">
        <button
          @click="toggleUserMenu"
          class="flex items-center gap-1 py-1 px-2 pr-2 bg-transparent border-none rounded-md cursor-pointer transition-colors text-text-muted-light dark:text-text-muted-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
        >
          <div class="w-7 h-7 flex items-center justify-center bg-primary text-white rounded-md text-xs font-semibold">
            <FlowIcon icon="material-symbols:person" :size="14" />
          </div>
          <FlowIcon
            icon="material-symbols:keyboard-arrow-down"
            :size="12"
            :class="{ 'rotate-180': showUserMenu }"
            class="transition-transform duration-200"
          />
        </button>

        <!-- User Menu Dropdown -->
        <div
          v-if="showUserMenu"
          class="absolute right-0 top-full mt-2 w-48 bg-flow-surface dark:bg-flow-surface-dark border border-flow-border dark:border-flow-border-dark rounded-lg shadow-lg backdrop-blur-sm z-50 py-1"
        >
          <div class="px-3 py-2 border-b border-flow-border dark:border-flow-border-dark">
            <div class="text-xs text-flow-text-muted dark:text-flow-text-muted-dark">
              <div v-if="flowStore.isAuthenticated()">
                Flow ID: {{ flowStore.apiConfig.flowId }}
              </div>
              <div v-else>Not authenticated</div>
            </div>
          </div>

          <button
            v-if="flowStore.isAuthenticated()"
            @click="handleLogout"
            class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <FlowIcon icon="material-symbols:logout" :size="16" />
            Clear Credentials
          </button>

          <button
            @click="showUserMenu = false"
            class="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-flow-text-secondary dark:text-flow-text-secondary-dark hover:bg-flow-surface-hover dark:hover:bg-flow-surface-hover-dark transition-colors"
          >
            <FlowIcon icon="material-symbols:close" :size="16" />
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import { useTheme } from '../composables/useTheme.js'
import FlowIcon from './Icon.vue'

const props = defineProps({
  canUndo: {
    type: Boolean,
    default: false
  },
  canRedo: {
    type: Boolean,
    default: false
  },
  executionStatus: {
    type: String,
    default: null // null, 'running', 'success', 'error'
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'execute',
  'clear',
  'undo',
  'redo',
  'toggleHelp',
  'save' // 🚀 NOVO
])

const flowStore = useFlowStore()
const { isDark, toggleTheme } = useTheme()

// User menu state
const showUserMenu = ref(false)
const userMenuRef = ref(null)

const statusText = computed(() => {
  switch (props.executionStatus) {
    case 'running': return 'Executing...'
    case 'success': return 'Executed'
    case 'error': return 'Error'
    default: return ''
  }
})

const syncStatus = computed(() => flowStore.syncStatus)

const syncIcon = computed(() => {
  // 🚀 NOVO: Se há mudanças pendentes, mostrar ícone de "upload pending"
  if (props.hasUnsavedChanges && syncStatus.value !== 'syncing') {
    return 'material-symbols:cloud-upload'
  }

  switch (syncStatus.value) {
    case 'synced': return 'material-symbols:cloud-done'
    case 'syncing': return 'material-symbols:sync'
    case 'error': return 'material-symbols:cloud-off'
    case 'offline': return 'material-symbols:wifi-off'
    default: return 'material-symbols:cloud'
  }
})

const syncText = computed(() => {
  // 🚀 NOVO: Se há mudanças pendentes, mostrar "Unsaved"
  if (props.hasUnsavedChanges && syncStatus.value !== 'syncing') {
    return 'Unsaved'
  }

  switch (syncStatus.value) {
    case 'synced': return 'Saved'
    case 'syncing': return 'Saving...'
    case 'error': return 'Error'
    case 'offline': return 'Offline'
    default: return ''
  }
})

const syncTooltip = computed(() => {
  // 🚀 NOVO: Tooltip específico para mudanças pendentes
  if (props.hasUnsavedChanges && syncStatus.value !== 'syncing') {
    return 'You have unsaved changes (will auto-save in up to 2 minutes)'
  }

  switch (syncStatus.value) {
    case 'synced': return 'All changes saved to cloud'
    case 'syncing': return 'Saving changes...'
    case 'error': return 'Failed to save changes'
    case 'offline': return 'No connection to server'
    default: return ''
  }
})

// User menu functions
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const handleExecuteClick = () => {
  emit('execute')
}

// 🚀 NOVO: Computeds e handler para botão de save
const saveButtonText = computed(() => {
  if (syncStatus.value === 'syncing') return 'Saving...'
  if (props.hasUnsavedChanges) return 'Save'
  return 'Saved'
})

const saveButtonTooltip = computed(() => {
  if (syncStatus.value === 'syncing') return 'Saving changes to cloud...'
  if (props.hasUnsavedChanges) return 'Save changes to cloud (Ctrl+S)'
  return 'No unsaved changes'
})

const handleSaveClick = () => {
  if (props.hasUnsavedChanges && syncStatus.value !== 'syncing') {
    emit('save')
  }
}

const handleLogout = () => {
  if (confirm('Are you sure you want to clear your credentials? You will need to reload with a new token to continue.')) {
    flowStore.clearCredentials()
    showUserMenu.value = false
    alert('Credentials cleared. Please reload the page with a valid token to continue.')
  }
}

// Close user menu when clicking outside
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

// Add event listeners for closing menu
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* No additional styles needed - all converted to Tailwind classes */
</style>