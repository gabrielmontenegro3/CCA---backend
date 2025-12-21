# 🔧 Instruções para Corrigir CRUD de Produtos - Front-end

## ⚠️ Problemas Identificados

1. **Erro `column produto.id does not exist`** - Campo `id` sendo enviado no body
2. **POST ao invés de PUT** - Ao editar, está fazendo POST quando deveria fazer PUT

## 🛠️ Correções Implementadas no Backend

1. **Melhor tratamento de erros** - Agora retorna mais detalhes sobre o erro
2. **Validação antes de deletar** - Verifica se o produto existe antes de deletar
3. **Rota de diagnóstico** - Nova rota para verificar o schema da tabela

## 📋 Ações Necessárias no Front-end

### 1. Atualizar o Serviço de Produtos

Adicione tratamento de erros mais robusto no seu serviço:

```typescript
// src/services/produtoService.ts

export const produtoService = {
  // ... outros métodos ...

  // Atualizar produto (ATUALIZADO)
  atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    try {
      // IMPORTANTE: Remover o campo 'id' do objeto se estiver presente
      const { id: _, ...produtoSemId } = produto as any;
      
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

      return response.json();
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      throw error;
    }
  },

  // Remover produto (ATUALIZADO)
  remover: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover produto');
      }
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  },
};
```

### 2. Corrigir o Formulário de Edição

**PROBLEMAS:**
1. Ao editar, o formulário pode estar enviando o campo `id` no body da requisição
2. Está fazendo POST ao invés de PUT quando edita

**SOLUÇÃO:** 
- Garantir que o campo `id` NÃO seja enviado no body
- **CRÍTICO:** Usar PUT quando editar (produto tem ID) e POST quando criar (produto não tem ID)

```typescript
// src/components/ProdutoForm.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  try {
    setLoading(true);
    
    // IMPORTANTE: Separar o ID dos dados do formulário
    const { id, ...dadosParaEnviar } = formData as any;
    
    // CRÍTICO: Verificar se é edição (tem ID) ou criação (não tem ID)
    if (produto?.id) {
      // ✅ EDITAR: Usar PUT com o ID na URL
      console.log('Editando produto ID:', produto.id); // Debug
      await produtoService.atualizar(produto.id, dadosParaEnviar);
    } else {
      // ✅ CRIAR: Usar POST sem ID
      console.log('Criando novo produto'); // Debug
      await produtoService.criar(dadosParaEnviar);
    }
    
    onSave();
  } catch (err: any) {
    // Melhorar mensagem de erro
    const mensagemErro = err.message || 'Erro ao salvar produto';
    alert('Erro ao salvar: ' + mensagemErro);
    console.error('Erro completo:', err);
  } finally {
    setLoading(false);
  }
};
```

### 3. Melhorar Tratamento de Erros na Listagem

```typescript
// src/components/ProdutosPage.tsx

const handleEditar = (produto: Produto) => {
  // Garantir que estamos passando apenas os dados necessários
  const produtoParaEditar = {
    ...produto,
    // Garantir que campos null/undefined sejam tratados
    prazo_garantia_abnt_meses: produto.prazo_garantia_abnt_meses ?? null,
    prazo_garantia_fabrica_meses: produto.prazo_garantia_fabrica_meses ?? null,
    frequencia_preventiva_meses: produto.frequencia_preventiva_meses ?? null,
    regras_manutencao: produto.regras_manutencao ?? null,
    manual_pdf_url: produto.manual_pdf_url ?? null,
  };
  
  setProdutoEditando(produtoParaEditar);
  setShowForm(true);
};

const handleExcluir = async (id: number) => {
  if (!id) {
    alert('ID do produto não encontrado');
    return;
  }

  if (window.confirm('Tem certeza que deseja excluir este produto?')) {
    try {
      await produtoService.remover(id);
      await carregarProdutos(); // Recarregar lista
      // Mostrar mensagem de sucesso
      alert('Produto excluído com sucesso!');
    } catch (err: any) {
      const mensagemErro = err.message || 'Erro ao excluir produto';
      alert('Erro ao excluir: ' + mensagemErro);
      console.error('Erro completo:', err);
    }
  }
};
```

### 4. Adicionar Função de Diagnóstico (Opcional)

Crie uma função para testar a conexão e verificar o schema:

```typescript
// src/services/diagnosticoService.ts

export const diagnosticoService = {
  verificarSchemaProduto: async () => {
    try {
      const response = await fetch('http://localhost:3000/debug/produto-schema');
      const data = await response.json();
      console.log('Schema da tabela produto:', data);
      return data;
    } catch (error) {
      console.error('Erro ao verificar schema:', error);
      throw error;
    }
  }
};
```

## 🔍 Checklist de Verificação

### Antes de Testar:

- [ ] Verificar se o backend está rodando (`http://localhost:3000/health`)
- [ ] Verificar se a URL da API está correta no front-end
- [ ] Verificar se o campo `id` não está sendo enviado no body das requisições PUT

### Ao Editar:

- [ ] O formulário carrega os dados corretamente?
- [ ] O campo `id` está sendo removido antes de enviar?
- [ ] Os campos opcionais (null) estão sendo tratados corretamente?
- [ ] A mensagem de erro é clara se algo der errado?

### Ao Excluir:

- [ ] A confirmação aparece antes de excluir?
- [ ] O ID está sendo passado corretamente?
- [ ] A lista é atualizada após exclusão?
- [ ] Mensagem de erro aparece se houver problema?

## 🐛 Debugging

### Verificar se está usando PUT ou POST:

1. **No Console do Navegador (F12):**
   - Abra o DevTools
   - Vá na aba "Network"
   - Tente editar um produto
   - Procure pela requisição
   - **VERIFIQUE O MÉTODO HTTP:**
     - ✅ Deve aparecer: `PUT /api/produtos/1`
     - ❌ Se aparecer: `POST /api/produtos/1` → ESTÁ ERRADO!

2. **Verificar o Request Payload:**
   - Clique na requisição
   - Veja o "Request Payload"
   - Não deve conter o campo `id`
   - Deve conter apenas os campos do produto

3. **Verificar a URL:**
   - ✅ Editar: `PUT /api/produtos/{id}`
   - ✅ Criar: `POST /api/produtos` (sem ID na URL)

### Se o erro persistir:

2. **Verificar a resposta da API:**
   - Na aba "Network", clique na requisição
   - Veja a resposta (Response)
   - Verifique se há mensagens de erro mais detalhadas

3. **Testar a rota de diagnóstico:**
   ```typescript
   // No console do navegador ou em um componente de teste
   fetch('http://localhost:3000/debug/produto-schema')
     .then(r => r.json())
     .then(console.log);
   ```

## 📝 Exemplo Completo Corrigido

### Serviço Atualizado:

```typescript
import { API_BASE_URL } from '../config/api';

export interface Produto {
  id?: number;
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
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar produto');
    }
    return response.json();
  },

  criar: async (produto: Omit<Produto, 'id'>): Promise<Produto> => {
    // Garantir que não há ID no objeto
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
    
    return response.json();
  },

  atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    // CRÍTICO: Remover o ID do objeto antes de enviar
    const { id: produtoId, ...produtoSemId } = produto as any;
    
    // VERIFICAR: Deve usar PUT, não POST!
    console.log('PUT /produtos/' + id, produtoSemId); // Debug
    
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'PUT', // ✅ DEVE SER PUT, NÃO POST!
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produtoSemId), // NÃO incluir ID aqui
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }
    
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    if (!id) {
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

### Formulário Atualizado (COM VERIFICAÇÃO DE MÉTODO):

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) {
    return;
  }

  try {
    setLoading(true);
    
    // Preparar dados para envio (sem ID)
    const dadosParaEnviar: Omit<Produto, 'id'> = {
      nome_produto: formData.nome_produto,
      codigo_sku: formData.codigo_sku,
      categoria: formData.categoria,
      unidade_medida: formData.unidade_medida,
      prazo_garantia_abnt_meses: formData.prazo_garantia_abnt_meses || null,
      prazo_garantia_fabrica_meses: formData.prazo_garantia_fabrica_meses || null,
      frequencia_preventiva_meses: formData.frequencia_preventiva_meses || null,
      regras_manutencao: formData.regras_manutencao || null,
      manual_pdf_url: formData.manual_pdf_url || null,
    };
    
    // CRÍTICO: Verificar se tem ID para decidir entre PUT e POST
    const isEditando = produto?.id !== undefined && produto?.id !== null;
    
    if (isEditando) {
      // ✅ EDITAR: PUT /api/produtos/{id}
      console.log('🔄 Editando produto ID:', produto.id);
      await produtoService.atualizar(produto.id, dadosParaEnviar);
    } else {
      // ✅ CRIAR: POST /api/produtos
      console.log('➕ Criando novo produto');
      await produtoService.criar(dadosParaEnviar);
    }
    
    onSave();
  } catch (err: any) {
    console.error('Erro ao salvar produto:', err);
    alert('Erro ao salvar produto: ' + (err.message || 'Erro desconhecido'));
  } finally {
    setLoading(false);
  }
};
```

### Verificação no Serviço (IMPORTANTE):

```typescript
// No produtoService.ts, verificar se está usando PUT corretamente:

atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
  // Remover ID do objeto
  const { id: produtoId, ...produtoSemId } = produto as any;
  
  // ✅ VERIFICAR: Deve ser PUT, não POST!
  const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
    method: 'PUT', // ⚠️ DEVE SER PUT!
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(produtoSemId),
  });
  
  // ... resto do código
}
```

## ⚡ Resumo das Correções

### Problemas Identificados:
1. O campo `id` estava sendo enviado no body da requisição PUT/DELETE
2. **Estava fazendo POST ao invés de PUT ao editar**

### Soluções:
1. **NUNCA** enviar o campo `id` no body das requisições
2. O `id` deve ir apenas na URL: `/api/produtos/{id}`
3. Remover o `id` do objeto antes de enviar: `const { id, ...resto } = produto`
4. **CRÍTICO:** Usar **PUT** para editar e **POST** para criar

### Código Chave:

#### Diferença entre Criar e Editar:
```typescript
// ✅ CRIAR - POST (sem ID)
if (!produto?.id) {
  await produtoService.criar(dados); // POST /api/produtos
}

// ✅ EDITAR - PUT (com ID na URL)
if (produto?.id) {
  await produtoService.atualizar(produto.id, dados); // PUT /api/produtos/{id}
}
```

#### Remover ID do Body:
```typescript
// ❌ ERRADO - Envia ID no body
await produtoService.atualizar(id, { id, ...outrosCampos });

// ✅ CORRETO - Remove ID antes de enviar
const { id: _, ...dadosSemId } = produto;
await produtoService.atualizar(id, dadosSemId);
```

#### Verificar Método HTTP:
```typescript
// ❌ ERRADO - POST para editar
fetch('/api/produtos/1', { method: 'POST', ... });

// ✅ CORRETO - PUT para editar
fetch('/api/produtos/1', { method: 'PUT', ... });
```

## 🎯 Próximos Passos

1. Atualizar o serviço de produtos conforme exemplos acima
2. Atualizar o formulário para não enviar o ID
3. Testar edição e exclusão
4. Verificar se os erros foram resolvidos
5. Adicionar feedback visual (toast/notificações) para melhor UX

---

**Última atualização:** Janeiro 2024
