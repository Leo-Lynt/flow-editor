<template>
  <div class="w-70 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search nodes..."
        class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500 dark:placeholder-gray-400"
      />
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="category in filteredCategories"
        :key="category.name"
        class="mb-1"
      >
        <div
          class="flex items-center px-3 py-2 cursor-pointer rounded-lg transition-all duration-200 select-none hover:bg-gray-50 dark:hover:bg-gray-800"
          @click="toggleCategory(category.name)"
        >
          <FlowIcon
            :icon="expandedCategories[category.name] ? 'material-symbols:keyboard-arrow-down' : 'material-symbols:keyboard-arrow-right'"
            :size="16"
            class="mr-2 transition-transform duration-200 text-gray-500 dark:text-gray-400"
          />
          <FlowIcon :icon="category.icon" :size="16" class="mr-2 text-gray-600 dark:text-gray-300" />
          <span class="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{{ category.name }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full font-medium">{{ category.nodes.length }}</span>
        </div>

        <div
          v-show="expandedCategories[category.name]"
          class="py-1"
        >
          <div
            v-for="node in category.nodes"
            :key="node.type"
            class="flex items-center px-3 py-3 mx-2 my-1 rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-800 border border-transparent"
            :class="isNodeDisabled(node.type)
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-move hover:bg-white dark:hover:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md hover:translate-x-1 active:cursor-grabbing active:scale-95'"
            :draggable="!isNodeDisabled(node.type)"
            @dragstart="handleDragStart($event, node)"
            @click="handleNodeClick(node)"
          >
            <div class="w-10 h-10 flex items-center justify-center rounded-lg mr-3 shrink-0 shadow-sm border"
                 :class="getNodeIconStyles(node.type)">
              <FlowIcon :icon="node.icon" :size="20" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{{ node.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ node.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import { useVueFlow } from '@vue-flow/core'
import FlowIcon from './Icon.vue'
// ⚡ NEW: Import Engine Registry
import { getAllCategories, getNodesByCategory } from '../engine/registry'

const flowStore = useFlowStore()
const { addNodes, project } = useVueFlow()

const searchQuery = ref('')
const expandedCategories = ref({})
const nodeCategories = ref([])

// ⚡ NEW: Carregar nodes do catálogo dinamicamente
onMounted(() => {
  loadNodesFromCatalog()
})

/**
 * Carrega nodes do catálogo registrado no engine
 */
function loadNodesFromCatalog() {
  try {
    // Buscar categorias do engine
    const categories = getAllCategories()

    // Mapear categorias para o formato do sidebar
    nodeCategories.value = categories.map(category => {
      const nodes = getNodesByCategory(category.id)

      // Mapear nodes para o formato esperado
      const mappedNodes = nodes.map(nodeDef => ({
        type: nodeDef.type,
        name: nodeDef.label,
        icon: nodeDef.icon,
        description: nodeDef.description,
        color: nodeDef.color // Guardar cor para uso futuro
      }))

      // Inicializar estado de expansão (primeira categoria expandida)
      const isFirstCategory = categories.indexOf(category) === 0
      expandedCategories.value[category.label] = isFirstCategory

      return {
        name: category.label,
        icon: category.icon,
        id: category.id,
        nodes: mappedNodes
      }
    })
  } catch (error) {
    // Fallback: usar estrutura vazia
    nodeCategories.value = []
  }
}

const filteredCategories = computed(() => {
  if (!searchQuery.value) return nodeCategories.value

  return nodeCategories.value.map(category => ({
    ...category,
    nodes: category.nodes.filter(node =>
      node.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0)
})

const toggleCategory = (categoryName) => {
  expandedCategories.value[categoryName] = !expandedCategories.value[categoryName]
}

// 🚀 NOVO: Verificar se node deve ser desabilitado
const isNodeDisabled = (nodeType) => {
  if (nodeType === 'input' && flowStore.flowValidation.hasInput) return true
  if (nodeType === 'output' && flowStore.flowValidation.hasOutput) return true
  return false
}

const handleDragStart = (event, node) => {
  // 🚀 VALIDAÇÃO: Bloquear drag de Input/Output se já existir
  if (node.type === 'input' && flowStore.flowValidation.hasInput) {
    event.preventDefault()
    console.warn('❌ Cannot add Input node: Flow already has an Input node')
    return
  }
  if (node.type === 'output' && flowStore.flowValidation.hasOutput) {
    event.preventDefault()
    console.warn('❌ Cannot add Output node: Flow already has an Output node')
    return
  }

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/vueflow', JSON.stringify(node))
}

const handleNodeClick = (node) => {
  // 🚀 VALIDAÇÃO: Bloquear click em Input/Output se já existir
  if (node.type === 'input' && flowStore.flowValidation.hasInput) {
    console.warn('❌ Cannot add Input node: Flow already has an Input node')
    return
  }
  if (node.type === 'output' && flowStore.flowValidation.hasOutput) {
    console.warn('❌ Cannot add Output node: Flow already has an Output node')
    return
  }

  // Get center of viewport
  const { x, y } = project({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  const newNode = createNodeFromType(node.type, { x, y })
  addNodes([newNode])
}

/**
 * Gera classes Tailwind baseadas na cor do node (do catálogo)
 * Mantém mapa estático como fallback
 */
const getNodeIconStyles = (type) => {
  // Mapa estático como fallback (compatibilidade)
  const staticStyles = {
    'input': 'bg-blue-100 dark:bg-blue-800/50 border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400',
    'connector': 'bg-green-100 dark:bg-green-800/50 border-green-200 dark:border-green-700/50 text-green-600 dark:text-green-400',
    'field-extractor': 'bg-cyan-100 dark:bg-cyan-800/50 border-cyan-200 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-400',
    'array-processor': 'bg-orange-100 dark:bg-orange-800/50 border-orange-200 dark:border-orange-700/50 text-orange-600 dark:text-orange-400',
    'add': 'bg-purple-100 dark:bg-purple-800/50 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-400',
    'subtract': 'bg-purple-100 dark:bg-purple-800/50 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-400',
    'multiply': 'bg-purple-100 dark:bg-purple-800/50 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-400',
    'divide': 'bg-purple-100 dark:bg-purple-800/50 border-purple-200 dark:border-purple-700/50 text-purple-600 dark:text-purple-400',
    'variable': 'bg-pink-100 dark:bg-pink-800/50 border-pink-200 dark:border-pink-700/50 text-pink-600 dark:text-pink-400',
    'output': 'bg-red-100 dark:bg-red-800/50 border-red-200 dark:border-red-700/50 text-red-600 dark:text-red-400'
  }

  // TODO: Futuro - gerar classes dinamicamente baseado na cor do catálogo
  // const nodeColor = findNodeColor(type)
  // return generateTailwindClasses(nodeColor)

  return staticStyles[type] || 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
}

const createNodeFromType = (type, position) => {
  const baseNode = {
    id: `${type}_${Date.now()}`,
    type,
    position,
    data: {}
  }

  switch (type) {
    case 'input':
      baseNode.data = {
        label: 'API Input',
        parameters: []
      }
      break
    case 'connector':
      baseNode.data = {
        label: 'Data Connector',
        sourceType: 'analytics',
        analyticsType: 'sales',
        selectedApi: 'custom',
        apiUrl: '',
        dataPath: '',
        mockData: Math.floor(Math.random() * 100)
      }
      break
    case 'field-extractor':
      baseNode.data = {
        label: 'Field Extractor',
        selectedFields: []
      }
      break
    case 'array-processor':
      baseNode.data = {
        label: 'Array Processor',
        operation: 'extract',
        fieldPath: '',
        filterValue: ''
      }
      break
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
      baseNode.data = {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        operation: type
      }
      break
    case 'output':
      baseNode.data = {
        label: 'My Output',
        outputFields: []
      }
      break
    case 'variable':
      baseNode.data = {
        label: 'Variable',
        mode: 'set',
        variableName: 'myVariable'
      }
      break
    default:
      baseNode.data = {
        label: type.charAt(0).toUpperCase() + type.slice(1)
      }
  }

  return baseNode
}
</script>

<style scoped>
/* No additional styles needed - all converted to Tailwind classes */
</style>