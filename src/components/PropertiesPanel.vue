<template>
  <div class="w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300" :class="{ 'visible': selectedNode }">
    <div v-if="!selectedNode" class="flex-1 flex flex-col items-center justify-center p-8">
      <FlowIcon icon="material-symbols:view-in-ar" :size="48" class="text-gray-400 dark:text-gray-500" />
      <p class="mt-4 text-gray-500 dark:text-gray-400 text-sm text-center">Select a node to view its properties</p>
    </div>

    <div v-else class="h-full flex flex-col">
      <div class="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mr-3">
          <FlowIcon :icon="getNodeIcon(selectedNode.type)" :size="20" class="text-gray-600 dark:text-gray-300" />
        </div>
        <div class="flex-1">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100 m-0">{{ selectedNode.data?.label || 'Node' }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 m-0 mt-0.5">{{ getNodeTypeName(selectedNode.type) }}</p>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center bg-transparent border-none rounded-md text-gray-500 dark:text-gray-400 cursor-pointer transition-colors duration-200 hover:bg-white dark:hover:bg-gray-900 hover:text-gray-700 dark:hover:text-gray-200">
          <FlowIcon icon="material-symbols:close" :size="16" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <!-- Dynamic Property Component -->
        <component
          v-if="currentPropertyComponent"
          :is="currentPropertyComponent"
          :node-id="selectedNode.id"
          :local-data="localData"
          @update-node-data="updateNodeData"
        />

        <!-- Fallback for nodes without specific property components -->
        <div v-else-if="selectedNode" class="mb-6">
          <div class="p-4 text-center text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
            No specific properties available for this node type.
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="deleteNode" class="w-full px-2.5 py-2.5 flex items-center justify-center gap-2 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border border-red-600 hover:border-red-700 rounded-md text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer transition-colors">
          <FlowIcon icon="material-symbols:delete" :size="16" />
          Delete Node
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useFlowStore } from '../stores/flowStore'
import FlowIcon from './Icon.vue'
import GenericProperties from './nodes/properties/GenericProperties.vue'
import OutputProperties from './nodes/properties/OutputProperties.vue'
import ArrayMergeProperties from './nodes/properties/ArrayMergeProperties.vue'
import ObjectCreateProperties from './nodes/properties/ObjectCreateProperties.vue'
import ArrayCreateProperties from './nodes/properties/ArrayCreateProperties.vue'

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'delete'])

const flowStore = useFlowStore()

// Property component específico por tipo de node
const currentPropertyComponent = computed(() => {
  if (!props.selectedNode) return null

  // Usar OutputProperties para nodes do tipo output
  if (props.selectedNode.type === 'output') {
    return OutputProperties
  }

  // Usar ArrayMergeProperties para nodes do tipo array-merge
  if (props.selectedNode.type === 'array-merge') {
    return ArrayMergeProperties
  }

  // Usar ObjectCreateProperties para nodes do tipo object-create
  if (props.selectedNode.type === 'object-create') {
    return ObjectCreateProperties
  }

  // Usar ArrayCreateProperties para nodes do tipo array-create
  if (props.selectedNode.type === 'array-create') {
    return ArrayCreateProperties
  }

  // Usar GenericProperties para os demais
  return GenericProperties
})

// Computed localData from flowStore (always fresh)
const localData = computed(() => {
  if (!props.selectedNode) return {}

  const storedData = flowStore.nodeData[props.selectedNode.id]
  const nodeData = storedData ? { ...storedData } : {}

  // Initialize selectedFields for field-extractor nodes if not present
  if (props.selectedNode.type === 'field-extractor') {
    if (!nodeData.selectedFields) {
      nodeData.selectedFields = []
    }
    if (!nodeData.fieldOutputsEnabled) {
      nodeData.fieldOutputsEnabled = {}
    }
    if (!nodeData.fieldTypes) {
      nodeData.fieldTypes = {}
    }
  }

  // Initialize outputFields array for output nodes if not present
  if (props.selectedNode.type === 'output' && !nodeData.outputFields) {
    nodeData.outputFields = []
  }

  return nodeData
})

const updateNodeData = () => {
  // This function is not needed anymore - GenericProperties updates directly
}




const deleteNode = () => {
  if (props.selectedNode) {
    flowStore.removeNode(props.selectedNode.id)
    emit('delete')
  }
}

const getNodeIcon = (type) => {
  const icons = {
    'input': 'material-symbols:input',
    'connector': 'material-symbols:cable',
    'field-extractor': 'material-symbols:filter-alt',
    'array-processor': 'material-symbols:list',
    'add': 'material-symbols:add',
    'subtract': 'material-symbols:remove',
    'multiply': 'material-symbols:close',
    'divide': 'material-symbols:percent',
    'variable': 'material-symbols:bookmark',
    'output': 'material-symbols:output'
  }
  return icons[type] || 'material-symbols:view-in-ar'
}

const getNodeTypeName = (type) => {
  const names = {
    'input': 'Input Parameters',
    'connector': 'Data Connector',
    'field-extractor': 'Field Extractor',
    'array-processor': 'Array Processor',
    'add': 'Addition',
    'subtract': 'Subtraction',
    'multiply': 'Multiplication',
    'divide': 'Division',
    'variable': 'Variable',
    'output': 'Output'
  }
  return names[type] || type
}

</script>

<style scoped>
/* All styling now handled by Tailwind classes */
</style>