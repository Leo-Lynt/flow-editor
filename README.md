# @flow-forge/editor

**UI Layer** para FlowForge - Editor visual de flows com Vue 3 + Vite.

## 📦 O que é o Editor?

O Editor é a interface visual do FlowForge que:

- 🎨 **Editor Visual**: Canvas interativo para criar flows (Vue Flow)
- 🧩 **Drag & Drop**: Arrastar nodes e conectá-los visualmente
- ⚡ **Auto-Execução**: Executa flows em tempo real no browser
- 🔌 **Integrações**: OAuth, APIs, Google Sheets (via API backend)
- 💾 **Persistência**: Salva flows no backend (MongoDB via API)
- 🎯 **Type System**: Sistema de tipos dinâmicos para validação visual

## 🏗️ Estrutura

```
packages/editor/src/
├── components/          # Componentes Vue
│   ├── flow/
│   │   ├── FlowCanvas.vue        # Canvas principal
│   │   ├── NodeSidebar.vue       # Catálogo de nodes
│   │   └── PropertiesPanel.vue   # Painel de propriedades
│   ├── nodes/
│   │   ├── GenericNode.vue       # Node genérico
│   │   └── properties/           # Painéis específicos
│   ├── toolbar/
│   │   └── Toolbar.vue           # Barra de ferramentas
│   └── form/                     # Componentes de form
│
├── stores/              # Pinia stores
│   ├── flowStore.js              # Estado principal
│   └── connectionStore.js        # Conexões OAuth
│
├── composables/         # Vue composables
│   ├── canvas/
│   │   └── useCanvas.js          # Lógica de canvas
│   ├── flow/
│   │   ├── useFlowExecution.js   # Execução de flows
│   │   └── useFlowValidation.js  # Validação
│   └── nodes/
│       └── useNodes.js           # Lógica de nodes
│
├── engine/              # Engine (estende Core)
│   ├── loader.js                 # ✨ Carrega nodes.json via API
│   ├── registry.js               # Registry frontend (Core + browser)
│   ├── executor.js               # Executor com UI features
│   └── typeSystem.js             # Type system + dynamic handles
│
├── methods/             # Apenas 2 methods browser-specific
│   ├── connectors/
│   │   └── connector.js          # OAuth, HTTP (via connectorService)
│   └── io/
│       └── output.js             # Download, clipboard (via outputService)
│
├── services/            # Serviços browser-specific
│   ├── connectorService.js       # Integrações OAuth/API
│   ├── outputService.js          # Download/clipboard
│   └── oauthService.js           # OAuth flow
│
├── utils/               # Utilitários frontend
│   ├── nodeFactory.js
│   ├── dataExamples.js
│   └── logger.js
│
├── views/               # Views/Pages
│   ├── HomeView.vue              # Editor principal
│   └── ConnectionsView.vue       # Gerenciar conexões
│
├── App.vue              # App principal
└── main.js              # Entry point
```

## 🚀 Instalação

```bash
cd packages/editor
pnpm install
```

## ⚙️ Configuração

Crie `.env`:

```env
# API Backend
VITE_API_URL=http://localhost:3001

# OAuth (opcional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## ▶️ Executar

```bash
# Desenvolvimento (hot reload)
pnpm dev

# Build para produção
pnpm build

# Preview do build
pnpm preview
```

Frontend estará disponível em `http://localhost:5173`

## 🔧 Como o Frontend usa o Core

### 1. Vite Alias para Core

**Config:** `vite.config.js`

```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@flow-forge/core': path.resolve(__dirname, '../core/src'),
      '@core-methods': path.resolve(__dirname, '../core/src/methods')
    }
  }
})
```

Agora pode importar diretamente:

```javascript
import { FlowEngine } from '@flow-forge/core'
import { unwrapData } from '@flow-forge/core/utils/dataUtils.js'
import { FRONTEND_TO_CANONICAL } from '@flow-forge/core/config/mappings.js'
```

### 2. Buscar nodes.json via API

**Antes:** Copiava nodes.json para `public/config/`

**Agora:** Busca via API com cache

**Loader:** `engine/loader.js`

```javascript
export async function loadNodeCatalog(apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001') {
  if (catalogLoaded) {
    return catalogData
  }

  // Cache bust em dev
  const cacheBuster = import.meta.env.DEV ? `?t=${Date.now()}` : ''
  const response = await fetch(`${apiUrl}/api/nodes${cacheBuster}`)

  if (!response.ok) {
    throw new Error(`Erro ao carregar catálogo: ${response.status}`)
  }

  const apiResponse = await response.json()

  if (!apiResponse.success) {
    throw new Error(`API error: ${apiResponse.error?.message}`)
  }

  const catalog = apiResponse.data

  // Validar e registrar nodes
  const validation = validateCatalog(catalog)
  if (!validation.valid) {
    throw new Error(`Catálogo inválido: ${validation.errors.join(', ')}`)
  }

  // Registrar categories e nodes
  catalog.categories.forEach(cat => registerCategory(cat.id, cat))
  catalog.nodes.forEach(node => registerNode(node.type, node))

  catalogLoaded = true
  catalogData = catalog

  return catalog
}
```

### 3. Registry Híbrido (Core + Browser)

**Registry:** `engine/registry.js`

```javascript
// Mapeia methods do CORE (33 arquivos)
const coreMethodsMap = {
  'lib/methods/processors/math.js': () => import('@core-methods/processors/math.js'),
  'lib/methods/processors/arrayMap.js': () => import('@core-methods/processors/arrayMap.js'),
  // ... 31 outros
}

// Mapeia methods do EDITOR (2 arquivos)
const editorMethodsMap = {
  'lib/methods/connectors/connector.js': () => import('../methods/connectors/connector.js'),
  'lib/methods/io/output.js': () => import('../methods/io/output.js')
}

async function loadMethod(modulePath) {
  // Tenta Core primeiro
  if (coreMethodsMap[modulePath]) {
    return await coreMethodsMap[modulePath]()
  }

  // Senão, tenta Editor
  if (editorMethodsMap[modulePath]) {
    return await editorMethodsMap[modulePath]()
  }

  throw new Error(`Method not found: ${modulePath}`)
}
```

**Por que 2 methods no Editor?**

- `connector.js`: Usa `connectorService` (OAuth, localStorage, fetch com CORS)
- `output.js`: Usa `outputService` (download files, clipboard API)

Esses serviços só existem no browser!

### 4. FlowEngine Integração

**Store:** `stores/flowStore.js`

```javascript
import { FlowEngine } from '@flow-forge/core'

export const useFlowStore = defineStore('flow', () => {
  const engine = new FlowEngine()

  async function executeFlow() {
    try {
      // Configurar engine
      engine.setConfig(
        { apiUrl: import.meta.env.VITE_API_URL },
        globalVariables.value
      )

      // Executar
      const results = await engine.executeFlow(nodes.value, edges.value)

      // Atualizar UI
      nodeResults.value = results

      return { success: true, results }
    } catch (error) {
      console.error('Erro ao executar flow:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    nodes,
    edges,
    executeFlow,
    // ...
  }
})
```

### 5. Usar Mappings do Core

**Exemplo:** Converter campos antes de enviar para API

```javascript
import { FRONTEND_TO_CANONICAL, mapSourceTypeToApi } from '@flow-forge/core/config/mappings.js'

function prepareNodeForExecution(node) {
  // Mapear sourceType
  const canonicalType = node.data.sourceType
  const apiType = mapSourceTypeToApi(canonicalType)

  // Mapear campos
  const mapping = FRONTEND_TO_CANONICAL[canonicalType]
  const canonicalFields = mapFields(node.data, mapping)

  return {
    ...node,
    data: {
      ...canonicalFields,
      sourceType: apiType
    }
  }
}
```

## 🎨 Componentes Principais

### FlowCanvas.vue

Editor principal com Vue Flow:

```vue
<template>
  <VueFlow
    v-model:nodes="nodes"
    v-model:edges="edges"
    @nodes-change="onNodesChange"
    @edges-change="onEdgesChange"
    @connect="onConnect"
  >
    <Background />
    <Controls />
    <MiniMap />
  </VueFlow>
</template>

<script setup>
import { VueFlow } from '@vue-flow/core'
import { useFlowStore } from '@/stores/flowStore'

const flowStore = useFlowStore()
const { nodes, edges } = storeToRefs(flowStore)
</script>
```

### NodeSidebar.vue

Catálogo de nodes disponíveis:

```vue
<template>
  <div class="sidebar">
    <div v-for="category in categories" :key="category.id">
      <h3>{{ category.name }}</h3>
      <div
        v-for="node in getNodesByCategory(category.id)"
        :key="node.type"
        draggable="true"
        @dragstart="onDragStart($event, node)"
      >
        <span>{{ node.icon }}</span>
        <span>{{ node.name }}</span>
      </div>
    </div>
  </div>
</template>
```

### PropertiesPanel.vue

Painel de propriedades do node selecionado:

```vue
<template>
  <div v-if="selectedNode" class="properties-panel">
    <h3>{{ selectedNode.name }}</h3>

    <!-- Campos de configuração dinâmicos -->
    <div v-for="field in selectedNode.config?.fields" :key="field.name">
      <label>{{ field.label }}</label>

      <input
        v-if="field.type === 'text'"
        v-model="selectedNode.data[field.name]"
        :placeholder="field.placeholder"
      />

      <select v-if="field.type === 'select'" v-model="selectedNode.data[field.name]">
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>

      <!-- Outros tipos... -->
    </div>
  </div>
</template>
```

## 🔄 Fluxo de Execução

### No Browser (Auto-Execução)

1. **User** arrasta nodes e conecta
2. **flowStore** detecta mudança
3. **AutoExecutionEngine** decide se auto-executar
4. **FlowEngine** executa flow localmente
5. **Registry** carrega methods (Core + Frontend)
6. **Methods** executam (connector pode chamar API)
7. **Results** atualizam nodeResults no store
8. **Vue** re-renderiza componentes

### Na API (Execução Completa)

1. **User** clica "Executar" ou "Salvar e Executar"
2. **flowStore** faz POST para `/api/flows/:id/execute`
3. **API** executa flow no servidor
4. **API** retorna resultado completo
5. **Editor** exibe resultado final

## 🎯 Exemplo: Criar Flow

```javascript
import { useFlowStore } from '@/stores/flowStore'

const flowStore = useFlowStore()

// 1. Adicionar node Connector
flowStore.addNode({
  type: 'connector',
  position: { x: 100, y: 100 },
  data: {
    function: 'execute',
    sourceType: 'google_sheets',
    sheetsUrl: 'https://docs.google.com/spreadsheets/...',
    sheetsConnectionId: 'conn_123'
  }
})

// 2. Adicionar node Math
flowStore.addNode({
  type: 'math',
  position: { x: 400, y: 100 },
  data: {
    function: 'add',
    b: 10
  }
})

// 3. Adicionar node Output
flowStore.addNode({
  type: 'output',
  position: { x: 700, y: 100 },
  data: {
    function: 'execute',
    destination: 'display'
  }
})

// 4. Conectar nodes
flowStore.addEdge({
  source: 'connector_1',
  sourceHandle: 'output',
  target: 'math_1',
  targetHandle: 'a'
})

flowStore.addEdge({
  source: 'math_1',
  sourceHandle: 'result',
  target: 'output_1',
  targetHandle: 'input'
})

// 5. Executar
await flowStore.executeFlow()
```

## 🔐 Autenticação

### Login

```javascript
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// Login com email/senha
await authStore.login('user@example.com', 'senha123')

// Login com Google OAuth
await authStore.loginWithGoogle()

// Verificar autenticação
if (authStore.isAuthenticated) {
  console.log('Usuário:', authStore.user)
}
```

### Axios Interceptor

Adiciona token automaticamente:

```javascript
// utils/axios.js
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(config => {
  const authStore = useAuthStore()
  if (authStore.accessToken) {
    config.headers.Authorization = `Bearer ${authStore.accessToken}`
  }
  return config
})

export default api
```

## 🎨 Styling com Tailwind

**Config:** `tailwind.config.js`

```javascript
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        secondary: '#2196F3'
      }
    }
  }
}
```

**Usar classes:**

```vue
<template>
  <div class="flex items-center justify-center h-screen bg-gray-100">
    <button class="px-4 py-2 bg-primary text-white rounded hover:bg-green-600">
      Executar Flow
    </button>
  </div>
</template>
```

## 🐛 Troubleshooting

### Erro: "Cannot resolve @flow-forge/core"

Verifique o alias no `vite.config.js`:

```javascript
resolve: {
  alias: {
    '@flow-forge/core': path.resolve(__dirname, '../core/src')
  }
}
```

### Erro: "Failed to fetch nodes.json"

1. API está rodando? `http://localhost:3001/health`
2. CORS configurado? Verifique `CORS_ORIGIN` no backend
3. `.env` tem `VITE_API_URL=http://localhost:3001`?

### Nodes não aparecem no sidebar

1. Verifique console do browser
2. Teste endpoint: `GET http://localhost:3001/api/nodes`
3. Verifique se `loadNodeCatalog()` foi chamado em `main.js`

### Build falha

```bash
# Limpar cache
rm -rf node_modules dist .vite

# Reinstalar
pnpm install

# Build
pnpm build
```

## 📊 Scripts

```bash
pnpm dev           # Dev server (hot reload)
pnpm build         # Build para produção
pnpm preview       # Preview do build
pnpm lint          # Lint com ESLint
```

## 🔧 Desenvolvimento

### Adicionar Novo Componente

```bash
# Criar componente
touch src/components/MyComponent.vue
```

```vue
<template>
  <div class="my-component">
    {{ message }}
  </div>
</template>

<script setup>
import { ref } from 'vue'

const message = ref('Hello!')
</script>

<style scoped>
.my-component {
  padding: 1rem;
}
</style>
```

### Adicionar Novo Composable

```bash
touch src/composables/useMyFeature.js
```

```javascript
import { ref, computed } from 'vue'

export function useMyFeature() {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return {
    count,
    doubled,
    increment
  }
}
```

### Adicionar Nova Route

```javascript
// router/index.js
{
  path: '/my-page',
  name: 'MyPage',
  component: () => import('../views/MyPageView.vue')
}
```

## 📄 License

MIT
