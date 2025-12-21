# 🔧 CORREÇÃO: Produto não possui ID válido

## ⚠️ Problema Identificado

O erro "Produto não possui ID válido para edição" indica que o campo `id` não está presente ou tem outro nome no retorno da API.

## 🔍 DIAGNÓSTICO

### Possíveis Causas:

1. **A coluna de ID tem outro nome no banco de dados**
   - Pode ser `id_produto` ao invés de `id`
   - Pode ser `produto_id` ou outro nome

2. **A API não está retornando o ID**
   - O Supabase pode estar ocultando a coluna
   - Pode haver problema na query

3. **O mapeamento dos dados está removendo o ID**
   - Algum processamento está removendo o campo

---

## ✅ SOLUÇÃO: Verificar e Mapear o ID Corretamente

### PASSO 1: Verificar qual é o nome real da coluna de ID

**No console do navegador, execute:**

```javascript
// Abra o console (F12) e execute:
fetch('http://localhost:3000/api/produtos')
  .then(r => r.json())
  .then(data => {
    console.log('📦 Primeiro produto:', data[0]);
    console.log('📦 Chaves disponíveis:', Object.keys(data[0]));
    console.log('📦 ID encontrado:', data[0].id || data[0].id_produto || 'NÃO ENCONTRADO');
  });
```

### PASSO 2: Ajustar o Front-end para Mapear o ID Corretamente

**Opção A: Se o ID vem com outro nome (ex: `id_produto`)**

```typescript
// src/services/produtoService.ts

export interface Produto {
  id?: number;
  id_produto?: number; // Se o banco usar este nome
  nome_produto: string;
  // ... outros campos
}

export const produtoService = {
  listar: async (): Promise<Produto[]> => {
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error('Erro ao listar produtos');
    }
    const dados = await response.json();
    
    // ✅ MAPEAR o ID se vier com outro nome
    return dados.map((produto: any) => ({
      ...produto,
      id: produto.id || produto.id_produto || produto.ID, // Tentar diferentes nomes
    }));
  },
  
  // ... outros métodos
};
```

**Opção B: Normalizar o ID no componente de listagem**

```typescript
// src/components/ProdutosPage.tsx

const carregarProdutos = async () => {
  try {
    setLoading(true);
    const dados = await produtoService.listar();
    
    // ✅ NORMALIZAR IDs - garantir que todos tenham 'id'
    const produtosNormalizados = dados.map((produto: any) => ({
      ...produto,
      id: produto.id || produto.id_produto || produto.ID || produto.Id,
    }));
    
    console.log('📦 Produtos normalizados:', produtosNormalizados);
    console.log('📦 Primeiro produto ID:', produtosNormalizados[0]?.id);
    
    setProdutos(produtosNormalizados);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### PASSO 3: Adicionar Validação e Logs

```typescript
// src/components/ProdutosPage.tsx

const handleEditar = (produto: Produto) => {
  // ✅ LOGS DE DEBUG
  console.log('🔍 Produto recebido:', produto);
  console.log('🔍 Todas as chaves:', Object.keys(produto));
  console.log('🔍 ID direto:', produto.id);
  console.log('🔍 id_produto:', (produto as any).id_produto);
  console.log('🔍 ID:', (produto as any).ID);
  
  // ✅ TENTAR ENCONTRAR O ID EM DIFERENTES CAMPOS
  const idProduto = produto.id 
    || (produto as any).id_produto 
    || (produto as any).ID 
    || (produto as any).Id;
  
  console.log('🔍 ID encontrado:', idProduto);
  
  if (!idProduto) {
    console.error('❌ ERRO: Nenhum ID encontrado!', produto);
    alert('Erro: Produto não possui ID válido. Verifique o console.');
    return;
  }
  
  // ✅ Criar produto com ID normalizado
  const produtoComId = {
    ...produto,
    id: idProduto, // Garantir que tem 'id'
  };
  
  console.log('✅ Produto com ID normalizado:', produtoComId);
  setProdutoEditando(produtoComId);
  setShowForm(true);
};
```

---

## 🛠️ SOLUÇÃO COMPLETA COM FALLBACK

### Serviço de Produtos com Normalização:

```typescript
// src/services/produtoService.ts

const API_BASE_URL = 'http://localhost:3000/api';

// Função auxiliar para normalizar ID
const normalizarId = (produto: any): number | undefined => {
  return produto.id 
    || produto.id_produto 
    || produto.ID 
    || produto.Id
    || produto.produto_id
    || undefined;
};

export interface Produto {
  id: number; // Sempre usar 'id' no front-end
  nome_produto: string;
  codigo_sku: string;
  categoria: string;
  unidade_medida: string;
  prazo_garantia_abnt_meses?: number | null;
  prazo_garantia_fabrica_meses?: number | null;
  frequencia_preventiva_meses?: number | null;
  regras_manutencao?: string | null;
  manual_pdf_url?: string | null;
}

export const produtoService = {
  listar: async (): Promise<Produto[]> => {
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error('Erro ao listar produtos');
    }
    const dados = await response.json();
    
    // ✅ Normalizar IDs
    return dados.map((produto: any) => {
      const id = normalizarId(produto);
      if (!id) {
        console.warn('⚠️ Produto sem ID:', produto);
      }
      return {
        ...produto,
        id: id || 0, // Usar 0 como fallback (não ideal, mas evita erro)
      };
    });
  },

  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar produto');
    }
    const produto = await response.json();
    
    // ✅ Normalizar ID
    const idNormalizado = normalizarId(produto);
    return {
      ...produto,
      id: idNormalizado || id,
    };
  },

  criar: async (produto: Omit<Produto, 'id'>): Promise<Produto> => {
    const { id: _, ...produtoSemId } = produto as any;
    
    const response = await fetch(`${API_BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produtoSemId),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar produto');
    }
    
    const produtoCriado = await response.json();
    // ✅ Normalizar ID do retorno
    return {
      ...produtoCriado,
      id: normalizarId(produtoCriado) || 0,
    };
  },

  atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    if (!id || id === 0) {
      throw new Error('ID do produto é obrigatório para atualização');
    }
    
    const { id: produtoId, ...produtoSemId } = produto as any;
    
    console.log('🔄 PUT /api/produtos/' + id);
    
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produtoSemId),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }
    
    const produtoAtualizado = await response.json();
    // ✅ Normalizar ID do retorno
    return {
      ...produtoAtualizado,
      id: normalizarId(produtoAtualizado) || id,
    };
  },

  remover: async (id: number): Promise<void> => {
    if (!id || id === 0) {
      throw new Error('ID do produto é obrigatório');
    }
    
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover produto');
    }
  },
};
```

---

## 🔍 VERIFICAÇÃO RÁPIDA

### 1. Testar no Console do Navegador:

```javascript
// Execute no console (F12):
fetch('http://localhost:3000/api/produtos')
  .then(r => r.json())
  .then(data => {
    if (data.length > 0) {
      const primeiro = data[0];
      console.log('Estrutura do produto:', primeiro);
      console.log('Chaves:', Object.keys(primeiro));
      console.log('Tem "id"?', 'id' in primeiro);
      console.log('Tem "id_produto"?', 'id_produto' in primeiro);
      console.log('Valor de id:', primeiro.id);
      console.log('Valor de id_produto:', primeiro.id_produto);
    }
  });
```

### 2. Verificar na Resposta da API:

No Network tab do DevTools:
- Abra a requisição `GET /api/produtos`
- Veja a resposta (Response)
- Verifique qual campo contém o ID

---

## 🎯 SOLUÇÃO TEMPORÁRIA (Se ID não vier da API)

Se a API realmente não retorna ID, você pode usar o índice do array (NÃO RECOMENDADO, mas funciona temporariamente):

```typescript
// ⚠️ SOLUÇÃO TEMPORÁRIA - NÃO IDEAL
const produtosComIndice = produtos.map((produto, index) => ({
  ...produto,
  id: produto.id || index + 1, // Usar índice como fallback
}));
```

**MAS:** O ideal é corrigir na API para retornar o ID corretamente.

---

## 📋 CHECKLIST

- [ ] Verificar no console qual é o nome real da coluna de ID
- [ ] Adicionar função `normalizarId()` no serviço
- [ ] Mapear todos os produtos para terem `id` normalizado
- [ ] Adicionar logs de debug para verificar
- [ ] Testar edição novamente
- [ ] Verificar no Network tab se a requisição PUT está sendo feita

---

## 🚨 AÇÃO IMEDIATA

1. **Execute no console do navegador:**
   ```javascript
   fetch('http://localhost:3000/api/produtos')
     .then(r => r.json())
     .then(data => console.log('Produto:', data[0], 'Chaves:', Object.keys(data[0])));
   ```

2. **Me informe:**
   - Quais são as chaves do objeto produto?
   - Existe algum campo que parece ser o ID?
   - Qual é o valor desse campo?

Com essas informações, posso ajustar o código para usar o nome correto da coluna de ID.

---

**Última atualização:** Janeiro 2024
