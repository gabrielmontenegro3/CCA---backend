# ✅ SOLUÇÃO: id_produto vs id

## 🎯 Problema Identificado

O banco de dados está retornando `id_produto` ao invés de `id`. O backend foi ajustado para normalizar automaticamente, mas o front-end também precisa mapear corretamente.

## ✅ CORREÇÃO NO FRONT-END

### Solução Rápida: Mapear id_produto para id

**No componente que recebe o produto para editar:**

```typescript
// src/components/Produtos.tsx ou similar

const abrirModalEditar = (produto: any) => {
  // ✅ MAPEAR id_produto para id
  const produtoNormalizado = {
    ...produto,
    id: produto.id || produto.id_produto, // ✅ Usar id_produto se id não existir
  };
  
  console.log('✅ Produto normalizado:', produtoNormalizado);
  console.log('✅ ID normalizado:', produtoNormalizado.id);
  
  // Agora usar produtoNormalizado ao invés de produto
  setProdutoEditando(produtoNormalizado);
  setShowForm(true);
};
```

### Solução Completa: Normalizar no Serviço

**Atualizar o serviço de produtos para sempre normalizar:**

```typescript
// src/services/produtoService.ts

export const produtoService = {
  listar: async (): Promise<Produto[]> => {
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error('Erro ao listar produtos');
    }
    const dados = await response.json();
    
    // ✅ NORMALIZAR: Mapear id_produto para id
    return dados.map((produto: any) => ({
      ...produto,
      id: produto.id || produto.id_produto, // ✅ Sempre ter 'id'
    }));
  },

  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar produto');
    }
    const produto = await response.json();
    
    // ✅ NORMALIZAR
    return {
      ...produto,
      id: produto.id || produto.id_produto,
    };
  },

  criar: async (produto: Omit<Produto, 'id'>): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar produto');
    }
    
    const produtoCriado = await response.json();
    // ✅ NORMALIZAR
    return {
      ...produtoCriado,
      id: produtoCriado.id || produtoCriado.id_produto,
    };
  },

  atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    const { id: produtoId, ...produtoSemId } = produto as any;
    
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
    // ✅ NORMALIZAR
    return {
      ...produtoAtualizado,
      id: produtoAtualizado.id || produtoAtualizado.id_produto,
    };
  },

  remover: async (id: number): Promise<void> => {
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

### Solução no Componente de Listagem

```typescript
// src/components/Produtos.tsx

const carregarProdutos = async () => {
  try {
    setLoading(true);
    const dados = await produtoService.listar();
    
    // ✅ NORMALIZAR IDs - garantir que todos tenham 'id'
    const produtosNormalizados = dados.map((produto: any) => ({
      ...produto,
      id: produto.id || produto.id_produto, // ✅ Mapear id_produto para id
    }));
    
    setProdutos(produtosNormalizados);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

const abrirModalEditar = (produto: any) => {
  // ✅ GARANTIR que o produto tem 'id'
  const produtoComId = {
    ...produto,
    id: produto.id || produto.id_produto, // ✅ Mapear id_produto para id
  };
  
  console.log('✅ Produto para editar:', produtoComId);
  console.log('✅ ID:', produtoComId.id);
  
  if (!produtoComId.id) {
    console.error('❌ ERRO: Produto não tem ID!', produto);
    alert('Erro: Produto não possui ID válido');
    return;
  }
  
  setProdutoEditando(produtoComId);
  setShowForm(true);
};
```

---

## 🎯 RESUMO DA CORREÇÃO

### O que está acontecendo:
- Banco retorna: `{ id_produto: 7, nome_produto: '...', ... }`
- Front-end procura: `produto.id` → `undefined` ❌

### Solução:
```typescript
// ✅ SEMPRE mapear id_produto para id
const produto = {
  ...produtoOriginal,
  id: produtoOriginal.id || produtoOriginal.id_produto,
};
```

### Onde aplicar:
1. **No serviço** - ao listar produtos
2. **No componente** - ao receber produto para editar
3. **Sempre normalizar** antes de usar `produto.id`

---

## 📋 CÓDIGO COMPLETO CORRIGIDO

### Interface atualizada:

```typescript
export interface Produto {
  id: number; // ✅ Sempre usar 'id' no front-end
  id_produto?: number; // Campo original do banco (opcional)
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
```

### Função auxiliar (recomendado):

```typescript
// src/utils/produtoUtils.ts

export const normalizarProduto = (produto: any): Produto => {
  return {
    ...produto,
    id: produto.id || produto.id_produto || 0,
  };
};

// Usar em todos os lugares:
const produtos = dados.map(normalizarProduto);
```

---

## ✅ CHECKLIST

- [ ] Atualizar serviço para normalizar `id_produto` → `id`
- [ ] Atualizar componente de listagem para normalizar
- [ ] Atualizar função `abrirModalEditar` para mapear `id_produto` → `id`
- [ ] Testar edição novamente
- [ ] Verificar se PUT está sendo chamado corretamente

---

**Última atualização:** Janeiro 2024



