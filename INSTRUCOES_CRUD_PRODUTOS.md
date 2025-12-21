# 📋 Instruções para Implementar CRUD de Produtos - Front-end

## 🎯 Objetivo

Implementar uma interface completa de CRUD (Create, Read, Update, Delete) para gerenciar produtos no sistema CCA.

## 🔌 Endpoints Disponíveis

A API já está configurada e funcionando. Use a URL base:
```
http://localhost:3000/api
```

### Endpoints de Produtos:

- **GET** `/api/produtos` - Listar todos os produtos
- **GET** `/api/produtos/:id` - Buscar produto por ID
- **POST** `/api/produtos` - Criar novo produto
- **PUT** `/api/produtos/:id` - Atualizar produto
- **DELETE** `/api/produtos/:id` - Remover produto

---

## 📦 Estrutura de Dados do Produto

### Modelo de Produto:

```typescript
interface Produto {
  id: number;
  nome_produto: string;
  codigo_sku: string;
  categoria: string;
  unidade_medida: string;
  prazo_garantia_abnt_meses: number | null;
  prazo_garantia_fabrica_meses: number | null;
  frequencia_preventiva_meses: number | null;
  regras_manutencao: string | null;
  manual_pdf_url: string | null;
}
```

### Campos Obrigatórios para Criação:

- `nome_produto` (string, obrigatório)
- `codigo_sku` (string, obrigatório)
- `categoria` (string, obrigatório)
- `unidade_medida` (string, obrigatório)

### Campos Opcionais:

- `prazo_garantia_abnt_meses` (number | null)
- `prazo_garantia_fabrica_meses` (number | null)
- `frequencia_preventiva_meses` (number | null)
- `regras_manutencao` (string | null)
- `manual_pdf_url` (string | null)

---

## 🏗️ Estrutura de Componentes Recomendada

### 1. Página Principal de Produtos (`ProdutosPage.tsx` ou `Produtos.tsx`)

**Funcionalidades:**
- Listar todos os produtos em uma tabela/cards
- Botão "Novo Produto" para abrir modal/formulário
- Botões de ação: Editar, Excluir, Visualizar
- Campo de busca/filtro
- Paginação (opcional)

**Layout sugerido:**
```
┌─────────────────────────────────────────┐
│  Produtos                    [+ Novo]   │
├─────────────────────────────────────────┤
│  [Buscar...]                            │
├─────────────────────────────────────────┤
│  Tabela/Lista de Produtos               │
│  ┌─────┬──────────┬──────────┬──────┐  │
│  │ SKU │ Nome     │ Categoria│ Ações│  │
│  ├─────┼──────────┼──────────┼──────┤  │
│  │ ... │ ...      │ ...     │ [⚙️🗑️]│  │
│  └─────┴──────────┴──────────┴──────┘  │
└─────────────────────────────────────────┘
```

### 2. Formulário de Produto (`ProdutoForm.tsx`)

**Funcionalidades:**
- Formulário para criar/editar produto
- Validação de campos obrigatórios
- Campos de texto, número e URL
- Botões: Salvar, Cancelar

**Campos do formulário:**
- Nome do Produto (texto, obrigatório)
- Código SKU (texto, obrigatório)
- Categoria (texto ou select, obrigatório)
- Unidade de Medida (texto ou select, obrigatório)
- Prazo Garantia ABNT (meses) (número, opcional)
- Prazo Garantia Fábrica (meses) (número, opcional)
- Frequência Preventiva (meses) (número, opcional)
- Regras de Manutenção (textarea, opcional)
- Manual PDF URL (URL, opcional)

### 3. Modal de Confirmação (`ConfirmModal.tsx`)

**Funcionalidades:**
- Modal para confirmar exclusão
- Exibir nome do produto a ser excluído
- Botões: Confirmar, Cancelar

---

## 💻 Implementação Detalhada

### Passo 1: Criar Serviço/API Client

Crie um arquivo `src/services/produtoService.ts` (ou similar):

```typescript
import api from '../config/api'; // ou seu cliente HTTP configurado

const API_BASE_URL = 'http://localhost:3000/api';

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
  // Listar todos os produtos
  listar: async (): Promise<Produto[]> => {
    const response = await fetch(`${API_BASE_URL}/produtos`);
    if (!response.ok) {
      throw new Error('Erro ao listar produtos');
    }
    return response.json();
  },

  // Buscar produto por ID
  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produto');
    }
    return response.json();
  },

  // Criar produto
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
    return response.json();
  },

  // Atualizar produto
  atualizar: async (id: number, produto: Partial<Produto>): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(produto),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }
    return response.json();
  },

  // Remover produto
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

### Passo 2: Criar Componente de Listagem

**Exemplo com React + TypeScript:**

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, Produto } from '../services/produtoService';

const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await produtoService.listar();
      setProdutos(dados);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNovo = () => {
    setProdutoEditando(null);
    setShowForm(true);
  };

  const handleEditar = (produto: Produto) => {
    setProdutoEditando(produto);
    setShowForm(true);
  };

  const handleExcluir = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtoService.remover(id);
        await carregarProdutos(); // Recarregar lista
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
    }
  };

  const handleSalvar = async () => {
    await carregarProdutos();
    setShowForm(false);
    setProdutoEditando(null);
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>Produtos</h1>
        <button onClick={handleNovo}>+ Novo Produto</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Unidade</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id}>
              <td>{produto.codigo_sku}</td>
              <td>{produto.nome_produto}</td>
              <td>{produto.categoria}</td>
              <td>{produto.unidade_medida}</td>
              <td>
                <button onClick={() => handleEditar(produto)}>Editar</button>
                <button onClick={() => handleExcluir(produto.id!)}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <ProdutoForm
          produto={produtoEditando}
          onSave={handleSalvar}
          onCancel={() => {
            setShowForm(false);
            setProdutoEditando(null);
          }}
        />
      )}
    </div>
  );
};

export default ProdutosPage;
```

### Passo 3: Criar Componente de Formulário

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, Produto } from '../services/produtoService';

interface ProdutoFormProps {
  produto: Produto | null;
  onSave: () => void;
  onCancel: () => void;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ produto, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Produto, 'id'>>({
    nome_produto: '',
    codigo_sku: '',
    categoria: '',
    unidade_medida: '',
    prazo_garantia_abnt_meses: null,
    prazo_garantia_fabrica_meses: null,
    frequencia_preventiva_meses: null,
    regras_manutencao: null,
    manual_pdf_url: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (produto) {
      setFormData({
        nome_produto: produto.nome_produto,
        codigo_sku: produto.codigo_sku,
        categoria: produto.categoria,
        unidade_medida: produto.unidade_medida,
        prazo_garantia_abnt_meses: produto.prazo_garantia_abnt_meses || null,
        prazo_garantia_fabrica_meses: produto.prazo_garantia_fabrica_meses || null,
        frequencia_preventiva_meses: produto.frequencia_preventiva_meses || null,
        regras_manutencao: produto.regras_manutencao || null,
        manual_pdf_url: produto.manual_pdf_url || null,
      });
    }
  }, [produto]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_produto.trim()) {
      newErrors.nome_produto = 'Nome do produto é obrigatório';
    }
    if (!formData.codigo_sku.trim()) {
      newErrors.codigo_sku = 'Código SKU é obrigatório';
    }
    if (!formData.categoria.trim()) {
      newErrors.categoria = 'Categoria é obrigatória';
    }
    if (!formData.unidade_medida.trim()) {
      newErrors.unidade_medida = 'Unidade de medida é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      if (produto?.id) {
        await produtoService.atualizar(produto.id, formData);
      } else {
        await produtoService.criar(formData);
      }
      onSave();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{produto ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Nome do Produto *</label>
            <input
              type="text"
              value={formData.nome_produto}
              onChange={(e) => handleChange('nome_produto', e.target.value)}
            />
            {errors.nome_produto && <span className="error">{errors.nome_produto}</span>}
          </div>

          <div>
            <label>Código SKU *</label>
            <input
              type="text"
              value={formData.codigo_sku}
              onChange={(e) => handleChange('codigo_sku', e.target.value)}
            />
            {errors.codigo_sku && <span className="error">{errors.codigo_sku}</span>}
          </div>

          <div>
            <label>Categoria *</label>
            <input
              type="text"
              value={formData.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
            />
            {errors.categoria && <span className="error">{errors.categoria}</span>}
          </div>

          <div>
            <label>Unidade de Medida *</label>
            <select
              value={formData.unidade_medida}
              onChange={(e) => handleChange('unidade_medida', e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="unidade">Unidade</option>
              <option value="metro">Metro</option>
              <option value="kg">Quilograma</option>
              <option value="litro">Litro</option>
            </select>
            {errors.unidade_medida && <span className="error">{errors.unidade_medida}</span>}
          </div>

          <div>
            <label>Prazo Garantia ABNT (meses)</label>
            <input
              type="number"
              value={formData.prazo_garantia_abnt_meses || ''}
              onChange={(e) => handleChange('prazo_garantia_abnt_meses', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>

          <div>
            <label>Prazo Garantia Fábrica (meses)</label>
            <input
              type="number"
              value={formData.prazo_garantia_fabrica_meses || ''}
              onChange={(e) => handleChange('prazo_garantia_fabrica_meses', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>

          <div>
            <label>Frequência Preventiva (meses)</label>
            <input
              type="number"
              value={formData.frequencia_preventiva_meses || ''}
              onChange={(e) => handleChange('frequencia_preventiva_meses', e.target.value ? parseInt(e.target.value) : null)}
            />
          </div>

          <div>
            <label>Regras de Manutenção</label>
            <textarea
              value={formData.regras_manutencao || ''}
              onChange={(e) => handleChange('regras_manutencao', e.target.value || null)}
              rows={4}
            />
          </div>

          <div>
            <label>Manual PDF URL</label>
            <input
              type="url"
              value={formData.manual_pdf_url || ''}
              onChange={(e) => handleChange('manual_pdf_url', e.target.value || null)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProdutoForm;
```

---

## ✅ Checklist de Implementação

### Funcionalidades Básicas:
- [ ] Listar todos os produtos
- [ ] Criar novo produto
- [ ] Editar produto existente
- [ ] Excluir produto (com confirmação)
- [ ] Validação de campos obrigatórios
- [ ] Tratamento de erros da API
- [ ] Loading states durante requisições
- [ ] Mensagens de sucesso/erro

### Melhorias Opcionais:
- [ ] Busca/filtro de produtos
- [ ] Paginação
- [ ] Ordenação de colunas
- [ ] Visualização detalhada do produto
- [ ] Upload de arquivo PDF (se necessário)
- [ ] Validação de URL do manual
- [ ] Autocomplete para categorias
- [ ] Histórico de alterações

---

## 🎨 Sugestões de UI/UX

1. **Tabela de Produtos:**
   - Use uma tabela responsiva ou cards em mobile
   - Destaque produtos com garantia vencendo
   - Ícones intuitivos para ações (✏️ Editar, 🗑️ Excluir)

2. **Formulário:**
   - Modal ou página separada
   - Campos organizados em seções
   - Validação em tempo real
   - Botões de ação sempre visíveis

3. **Feedback:**
   - Toast/notificações para sucesso/erro
   - Loading spinners durante requisições
   - Confirmação antes de excluir

4. **Responsividade:**
   - Layout adaptável para mobile
   - Formulário em coluna única em telas pequenas

---

## 🔗 Integração com Backend

### Exemplo de Requisição:

```typescript
// Criar produto
const novoProduto = {
  nome_produto: "Ar Condicionado Split",
  codigo_sku: "AC-001",
  categoria: "Climatização",
  unidade_medida: "unidade",
  prazo_garantia_abnt_meses: 12,
  prazo_garantia_fabrica_meses: 24,
  frequencia_preventiva_meses: 6,
  regras_manutencao: "Limpeza de filtros mensal",
  manual_pdf_url: "https://exemplo.com/manual.pdf"
};

await produtoService.criar(novoProduto);
```

### Tratamento de Erros:

```typescript
try {
  await produtoService.criar(produto);
  // Sucesso
} catch (error: any) {
  // Erro da API
  console.error('Erro:', error.message);
  // Mostrar mensagem para o usuário
}
```

---

## 📝 Notas Importantes

1. **URL da API:** Certifique-se de que a URL base está correta (`http://localhost:3000/api`)
2. **CORS:** O backend já está configurado com CORS, então não deve haver problemas de CORS
3. **Validação:** Sempre valide no front-end, mas a validação final é feita no backend
4. **IDs:** O ID é gerado automaticamente pelo banco de dados
5. **Campos Null:** Campos opcionais podem ser `null` ou string vazia, o backend aceita ambos

---

## 🚀 Próximos Passos Após Implementação

1. Testar todas as operações CRUD
2. Adicionar testes unitários (opcional)
3. Implementar busca e filtros
4. Adicionar paginação se houver muitos produtos
5. Integrar com outras telas (ex: ao criar chamado, selecionar produto)

---

**Última atualização:** Janeiro 2024

