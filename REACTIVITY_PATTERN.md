# 📖 Vue 3 Reactivity Pattern - Flow Forge

## 🎯 Objetivo

Este documento explica o padrão de reatividade usado no Flow Forge para garantir que todas as mudanças de estado sejam detectadas pelo Vue 3 e reflitam corretamente na UI.

---

## 🔍 O Problema

Vue 3 usa **Proxies** para detectar mudanças em refs e reactive objects. Porém, existem limitações:

### ❌ O que NÃO funciona (Vue não detecta):

```javascript
// Mutação direta de propriedades em ref de objeto
const executionResults = ref({})
executionResults.value[nodeId] = result  // ❌ Vue não detecta!

// Delete direto
delete executionResults.value[nodeId]  // ❌ Vue não detecta!

// Arrays - push funciona, mas não é o padrão recomendado
nodes.value.push(node)  // ⚠️ Funciona, mas inconsistente
```

### ✅ O que funciona (Vue detecta):

```javascript
// Substituir o objeto inteiro
executionResults.value = {
  ...executionResults.value,
  [nodeId]: result
}

// Remover criando novo objeto
const { [nodeId]: removed, ...rest } = executionResults.value
executionResults.value = rest

// Arrays - criar novo array
nodes.value = [...nodes.value, node]
nodes.value = nodes.value.filter(n => n.id !== nodeId)
```

---

## 🏗️ Padrão Implementado

### 1. **Actions Centralizadas para `executionResults`**

Todas as modificações em `executionResults` devem passar por actions da store:

```javascript
// ✅ SEMPRE usar estas funções
flowStore.setExecutionResult(nodeId, result)
flowStore.removeExecutionResult(nodeId)
flowStore.updateExecutionResults({ node1: result1, node2: result2 })
flowStore.clearAllExecutionResults()

// ❌ NUNCA fazer
executionResults.value[nodeId] = result
delete executionResults.value[nodeId]
```

**Implementação na flowStore.js:**

```javascript
const setExecutionResult = (nodeId, result) => {
  // Forçar reatividade recriando o objeto inteiro
  executionResults.value = {
    ...executionResults.value,
    [nodeId]: result
  }
  flowEngine.executionResults.set(nodeId, result)
}

const removeExecutionResult = (nodeId) => {
  const { [nodeId]: removed, ...rest } = executionResults.value
  executionResults.value = rest
  flowEngine.executionResults.delete(nodeId)
}

const updateExecutionResults = (updates) => {
  executionResults.value = {
    ...executionResults.value,
    ...updates
  }
  Object.entries(updates).forEach(([nodeId, result]) => {
    flowEngine.executionResults.set(nodeId, result)
  })
}

const clearAllExecutionResults = () => {
  executionResults.value = {}
  flowEngine.clearExecutionResults()
}
```

---

### 2. **Padrão para `nodeData`**

```javascript
// ✅ Adicionar node
const addNode = (node) => {
  nodes.value = [...nodes.value, node]
  nodeData.value = {
    ...nodeData.value,
    [node.id]: {}
  }
}

// ✅ Remover node
const removeNode = (nodeId) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  const { [nodeId]: removed, ...rest } = nodeData.value
  nodeData.value = rest
}

// ✅ Atualizar nodeData
const updateNodeData = (nodeId, data) => {
  const updatedData = { ...nodeData.value[nodeId], ...data }
  nodeData.value = {
    ...nodeData.value,
    [nodeId]: updatedData
  }
  flowEngine.setNodeData(nodeId, updatedData)
}
```

---

### 3. **Padrão para Arrays (`nodes`, `edges`)**

```javascript
// ✅ Adicionar item
nodes.value = [...nodes.value, newNode]
edges.value = [...edges.value, newEdge]

// ✅ Remover item
nodes.value = nodes.value.filter(n => n.id !== nodeId)
edges.value = edges.value.filter(e => e.id !== edgeId)

// ❌ EVITAR (mesmo que funcione)
nodes.value.push(newNode)
nodes.value.splice(index, 1)
```

---

## 🧪 Como Testar

### Teste Manual:

1. Abra DevTools Console
2. Mude um valor em um Input node
3. Verifique se:
   - ✅ Visualização do node atualiza
   - ✅ Nodes conectados downstream executam automaticamente
   - ✅ Valores propagam corretamente

### Teste no Código:

```javascript
// Adicionar watcher temporário para debug
watch(executionResults, (newVal, oldVal) => {
  console.log('executionResults changed:', newVal)
}, { deep: true })
```

Se o log aparecer quando você muda valores, a reatividade está funcionando! ✅

---

## 📚 Regras de Ouro

### ✅ **SEMPRE:**

1. Use actions da store ao invés de mutações diretas
2. Crie novos objetos/arrays ao invés de mutar existentes
3. Use spread operator (`...`) para copiar e modificar
4. Exporte todas as actions no `return` da store
5. Sincronize com Core engines (`flowEngine`, `typeEngine`)

### ❌ **NUNCA:**

1. Mutar diretamente `ref.value[key] = value`
2. Usar `delete ref.value[key]`
3. Esquecer de sincronizar com Core engines
4. Assumir que Vue detecta todas as mutações automaticamente

---

## 🔧 Troubleshooting

### Problema: UI não atualiza quando mudo um valor

**Causa:** Mutação direta em ref de objeto

**Solução:**
```javascript
// ❌ Antes
executionResults.value[nodeId] = result

// ✅ Depois
setExecutionResult(nodeId, result)
```

---

### Problema: Watcher não dispara

**Causa:** Objeto ref não está sendo substituído

**Solução:**
```javascript
// ❌ Antes
nodeData.value[id] = { ...data }

// ✅ Depois
nodeData.value = { ...nodeData.value, [id]: data }
```

---

### Problema: Performance ruim com muitos nodes

**Causa:** Spread operator cria novos objetos a cada mudança

**Solução:**
- Use `shallowRef` se não precisa de reatividade profunda
- Considere `reactive()` ao invés de `ref({})` para objetos grandes
- Faça batch updates com `updateExecutionResults()`

---

## 📖 Referências

- [Vue 3 Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue 3 Reactivity in Depth](https://vuejs.org/guide/extras/reactivity-in-depth.html)
- [Pinia Store Patterns](https://pinia.vuejs.org/core-concepts/)

---

## 🎓 Exemplo Completo

```javascript
// ❌ ERRADO - Não garante reatividade
const flowStore = useFlowStore()
flowStore.executionResults[nodeId] = { output: 'value' }

// ✅ CORRETO - Garante reatividade
const flowStore = useFlowStore()
flowStore.setExecutionResult(nodeId, { output: 'value' })

// ✅ CORRETO - Batch update
flowStore.updateExecutionResults({
  node1: { output: 'value1' },
  node2: { output: 'value2' }
})
```

---

**Última atualização:** 2025-01-12
**Autor:** Claude (Anthropic)
**Status:** ✅ Implementado e funcionando
