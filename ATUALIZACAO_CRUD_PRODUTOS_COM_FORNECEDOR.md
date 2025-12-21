# 🛠️ Atualização: CRUD de Produtos com Relacionamento de Fornecedor

## 🎯 Objetivo

Atualizar a funcionalidade de CRUD de Produtos para incluir o relacionamento com **Fornecedor** através da chave estrangeira `id_fornecedor`. Ao criar/editar um produto, deve haver um **select/dropdown** que mostra os fornecedores disponíveis.

---

## 📋 Estrutura da Tabela Produto

```sql
CREATE TABLE produto (
    id_produto SERIAL PRIMARY KEY,
    nome_produto VARCHAR(255),
    codigo_sku VARCHAR(255),
    categoria VARCHAR(255),
    unidade_medida VARCHAR(255),
    prazo_garantia_abnt_meses INT,
    prazo_garantia_fabrica_meses INT,
    frequencia_preventiva_meses INT,
    regras_manutencao TEXT,
    manual_pdf_url TEXT,
    id_fornecedor INT, -- Chave estrangeira para tabela fornecedor
    FOREIGN KEY (id_fornecedor) REFERENCES fornecedor(id_fornecedor)
);
```

**Campos:**
- `id_produto` (PK) - ID único do produto
- `nome_produto` - Nome do produto
- `codigo_sku` - Código SKU
- `categoria` - Categoria do produto
- `unidade_medida` - Unidade de medida
- `prazo_garantia_abnt_meses` - Prazo de garantia ABNT em meses
- `prazo_garantia_fabrica_meses` - Prazo de garantia da fábrica em meses
- `frequencia_preventiva_meses` - Frequência de manutenção preventiva em meses
- `regras_manutencao` - Regras de manutenção (texto)
- `manual_pdf_url` - URL do manual em PDF
- `id_fornecedor` (FK) - **Chave estrangeira para fornecedor** (opcional)

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api
```

### 1. Listar Produtos (com dados do fornecedor)

**GET** `/api/produtos`

**Resposta (200):**
```json
[
  {
    "id": 1,
    "id_produto": 1,
    "nome_produto": "Produto Exemplo",
    "codigo_sku": "SKU123",
    "categoria": "Eletrônicos",
    "unidade_medida": "unidade",
    "prazo_garantia_abnt_meses": 12,
    "prazo_garantia_fabrica_meses": 24,
    "frequencia_preventiva_meses": 6,
    "regras_manutencao": "Manutenção a cada 6 meses",
    "manual_pdf_url": "https://example.com/manual.pdf",
    "id_fornecedor": 1,
    "fornecedor": {
      "id": 1,
      "id_fornecedor": 1,
      "nome_fantasia": "Alpha Company",
      "cnpj": "112212121",
      "area_especialidade": "hidraulic"
    }
  }
]
```

**Nota:** Se o produto não tiver `id_fornecedor`, o campo `fornecedor` será `null`.

### 2. Buscar Produto por ID (com dados do fornecedor)

**GET** `/api/produtos/:id`

**Exemplo:**
```
GET /api/produtos/1
```

**Resposta (200):** Mesma estrutura do item da lista acima

### 3. Criar Produto

**POST** `/api/produtos`

**Body:**
```json
{
  "nome_produto": "Produto Exemplo",
  "codigo_sku": "SKU123",
  "categoria": "Eletrônicos",
  "unidade_medida": "unidade",
  "prazo_garantia_abnt_meses": 12,
  "prazo_garantia_fabrica_meses": 24,
  "frequencia_preventiva_meses": 6,
  "regras_manutencao": "Manutenção a cada 6 meses",
  "manual_pdf_url": "https://example.com/manual.pdf",
  "id_fornecedor": 1
}
```

**Campos:**
- Todos os campos são opcionais, exceto que pelo menos `nome_produto` deve ser fornecido
- `id_fornecedor` é **opcional** - se fornecido, o fornecedor deve existir

**Validação:**
- Se `id_fornecedor` for fornecido, o sistema valida se o fornecedor existe
- Se o fornecedor não existir, retorna erro 400

**Resposta (201):** Mesma estrutura da listagem (inclui dados do fornecedor)

### 4. Atualizar Produto

**PUT** `/api/produtos/:id`

**Body:**
```json
{
  "nome_produto": "Produto Atualizado",
  "id_fornecedor": 2
}
```

**Nota:** Você pode atualizar qualquer campo, exceto `id` e `id_produto`.

**Validação:**
- Se `id_fornecedor` for fornecido, o sistema valida se o fornecedor existe

**Resposta (200):** Mesma estrutura da listagem

### 5. Excluir Produto

**DELETE** `/api/produtos/:id`

**Exemplo:**
```
DELETE /api/produtos/1
```

**Resposta (200):**
```json
{
  "message": "Produto removido com sucesso"
}
```

### 6. Listar Fornecedores (para o select)

**GET** `/api/fornecedores`

**Resposta (200):**
```json
[
  {
    "id": 1,
    "id_fornecedor": 1,
    "nome_fantasia": "Alpha Company",
    "cnpj": "112212121",
    "area_especialidade": "hidraulic",
    "fornecedor_contato": "33333222"
  }
]
```

**Uso:** Use este endpoint para popular o select/dropdown de fornecedores no formulário de produto.

---

## ✅ IMPLEMENTAÇÃO NO FRONT-END

### 1. Atualizar o Serviço de Produtos

**Arquivo:** `src/services/produtoService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export interface Fornecedor {
  id: number;
  id_fornecedor: number;
  nome_fantasia: string;
  cnpj?: string | null;
  area_especialidade?: string | null;
  fornecedor_contato?: string | null;
}

export interface Produto {
  id: number; // ID do produto (id_produto)
  id_produto: number; // Mesmo que id (normalizado)
  nome_produto?: string | null;
  codigo_sku?: string | null;
  categoria?: string | null;
  unidade_medida?: string | null;
  prazo_garantia_abnt_meses?: number | null;
  prazo_garantia_fabrica_meses?: number | null;
  frequencia_preventiva_meses?: number | null;
  regras_manutencao?: string | null;
  manual_pdf_url?: string | null;
  id_fornecedor?: number | null; // Chave estrangeira
  fornecedor?: Fornecedor | null; // Dados do fornecedor (preenchido pela API)
}

export interface CriarProdutoDTO {
  nome_produto?: string | null;
  codigo_sku?: string | null;
  categoria?: string | null;
  unidade_medida?: string | null;
  prazo_garantia_abnt_meses?: number | null;
  prazo_garantia_fabrica_meses?: number | null;
  frequencia_preventiva_meses?: number | null;
  regras_manutencao?: string | null;
  manual_pdf_url?: string | null;
  id_fornecedor?: number | null; // ✅ NOVO: ID do fornecedor
}

export interface AtualizarProdutoDTO {
  nome_produto?: string | null;
  codigo_sku?: string | null;
  categoria?: string | null;
  unidade_medida?: string | null;
  prazo_garantia_abnt_meses?: number | null;
  prazo_garantia_fabrica_meses?: number | null;
  frequencia_preventiva_meses?: number | null;
  regras_manutencao?: string | null;
  manual_pdf_url?: string | null;
  id_fornecedor?: number | null; // ✅ NOVO: ID do fornecedor
}

export const produtoService = {
  // Listar todos os produtos
  listar: async (): Promise<Produto[]> => {
    const response = await fetch(`${API_BASE_URL}/produtos`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar produtos');
    }

    const dados = await response.json();
    
    // ✅ Normalizar IDs
    return dados.map((produto: any) => ({
      ...produto,
      id: produto.id || produto.id_produto,
      id_produto: produto.id_produto || produto.id,
    }));
  },

  // Buscar produto por ID
  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar produto');
    }

    const produto = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...produto,
      id: produto.id || produto.id_produto,
      id_produto: produto.id_produto || produto.id,
    };
  },

  // Criar produto
  criar: async (dados: CriarProdutoDTO): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar produto');
    }

    const produto = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...produto,
      id: produto.id || produto.id_produto,
      id_produto: produto.id_produto || produto.id,
    };
  },

  // Atualizar produto
  atualizar: async (id: number, dados: AtualizarProdutoDTO): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }

    const produto = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...produto,
      id: produto.id || produto.id_produto,
      id_produto: produto.id_produto || produto.id,
    };
  },

  // Remover produto
  remover: async (id: number): Promise<void> => {
    if (!id || id === 0) {
      throw new Error('ID do produto é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover produto');
    }
  },
};
```

---

### 2. Criar/Atualizar Serviço de Fornecedores (para o select)

**Arquivo:** `src/services/fornecedorService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export interface Fornecedor {
  id: number;
  id_fornecedor: number;
  nome_fantasia: string;
  cnpj?: string | null;
  area_especialidade?: string | null;
  fornecedor_contato?: string | null;
}

export const fornecedorService = {
  // Listar todos os fornecedores (para popular o select)
  listar: async (): Promise<Fornecedor[]> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar fornecedores');
    }

    const dados = await response.json();
    
    // ✅ Normalizar IDs
    return dados.map((fornecedor: any) => ({
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    }));
  },
};
```

---

### 3. Atualizar o Componente de Formulário de Produto

**Arquivo:** `src/components/ProdutoForm.tsx` ou similar

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, Produto, CriarProdutoDTO, AtualizarProdutoDTO } from '../services/produtoService';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';

interface ProdutoFormProps {
  produto?: Produto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ produto, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CriarProdutoDTO>({
    nome_produto: produto?.nome_produto || '',
    codigo_sku: produto?.codigo_sku || '',
    categoria: produto?.categoria || '',
    unidade_medida: produto?.unidade_medida || '',
    prazo_garantia_abnt_meses: produto?.prazo_garantia_abnt_meses || null,
    prazo_garantia_fabrica_meses: produto?.prazo_garantia_fabrica_meses || null,
    frequencia_preventiva_meses: produto?.frequencia_preventiva_meses || null,
    regras_manutencao: produto?.regras_manutencao || '',
    manual_pdf_url: produto?.manual_pdf_url || '',
    id_fornecedor: produto?.id_fornecedor || null, // ✅ NOVO
  });

  // ✅ NOVO: Estado para lista de fornecedores
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditando = !!produto;

  // ✅ NOVO: Carregar fornecedores ao abrir o formulário
  useEffect(() => {
    const carregarFornecedores = async () => {
      try {
        setLoadingFornecedores(true);
        const dados = await fornecedorService.listar();
        setFornecedores(dados);
      } catch (err: any) {
        console.error('Erro ao carregar fornecedores:', err);
        setError('Erro ao carregar lista de fornecedores');
      } finally {
        setLoadingFornecedores(false);
      }
    };

    carregarFornecedores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      if (isEditando) {
        // Atualizar
        const dados: AtualizarProdutoDTO = {
          nome_produto: formData.nome_produto || null,
          codigo_sku: formData.codigo_sku || null,
          categoria: formData.categoria || null,
          unidade_medida: formData.unidade_medida || null,
          prazo_garantia_abnt_meses: formData.prazo_garantia_abnt_meses || null,
          prazo_garantia_fabrica_meses: formData.prazo_garantia_fabrica_meses || null,
          frequencia_preventiva_meses: formData.frequencia_preventiva_meses || null,
          regras_manutencao: formData.regras_manutencao || null,
          manual_pdf_url: formData.manual_pdf_url || null,
          id_fornecedor: formData.id_fornecedor || null, // ✅ NOVO
        };

        await produtoService.atualizar(produto!.id, dados);
        alert('✅ Produto atualizado com sucesso!');
      } else {
        // Criar
        const dados: CriarProdutoDTO = {
          nome_produto: formData.nome_produto || null,
          codigo_sku: formData.codigo_sku || null,
          categoria: formData.categoria || null,
          unidade_medida: formData.unidade_medida || null,
          prazo_garantia_abnt_meses: formData.prazo_garantia_abnt_meses || null,
          prazo_garantia_fabrica_meses: formData.prazo_garantia_fabrica_meses || null,
          frequencia_preventiva_meses: formData.frequencia_preventiva_meses || null,
          regras_manutencao: formData.regras_manutencao || null,
          manual_pdf_url: formData.manual_pdf_url || null,
          id_fornecedor: formData.id_fornecedor || null, // ✅ NOVO
        };

        await produtoService.criar(dados);
        alert('✅ Produto criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar produto:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEditando ? 'Editar Produto' : 'Novo Produto'}</h2>

        {error && (
          <div style={{ 
            color: 'red', 
            marginBottom: '15px', 
            padding: '10px', 
            backgroundColor: '#ffe6e6', 
            borderRadius: '4px' 
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ✅ NOVO: Campo Select de Fornecedor */}
          <div style={{ marginBottom: '15px' }}>
            <label>
              Fornecedor:
              <select
                value={formData.id_fornecedor || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  id_fornecedor: e.target.value ? parseInt(e.target.value) : null
                })}
                disabled={loadingFornecedores}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '5px', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd' 
                }}
              >
                <option value="">Selecione um fornecedor (opcional)</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome_fantasia}
                    {fornecedor.cnpj ? ` - CNPJ: ${fornecedor.cnpj}` : ''}
                  </option>
                ))}
              </select>
              {loadingFornecedores && (
                <small style={{ color: '#666' }}>Carregando fornecedores...</small>
              )}
            </label>
          </div>

          {/* Campos existentes do produto */}
          <div style={{ marginBottom: '15px' }}>
            <label>
              Nome do Produto:
              <input
                type="text"
                value={formData.nome_produto || ''}
                onChange={(e) => setFormData({ ...formData, nome_produto: e.target.value })}
                placeholder="Ex: Produto Exemplo"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Código SKU:
              <input
                type="text"
                value={formData.codigo_sku || ''}
                onChange={(e) => setFormData({ ...formData, codigo_sku: e.target.value })}
                placeholder="Ex: SKU123"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Categoria:
              <input
                type="text"
                value={formData.categoria || ''}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Eletrônicos"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Unidade de Medida:
              <input
                type="text"
                value={formData.unidade_medida || ''}
                onChange={(e) => setFormData({ ...formData, unidade_medida: e.target.value })}
                placeholder="Ex: unidade, kg, m²"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Prazo Garantia ABNT (meses):
              <input
                type="number"
                value={formData.prazo_garantia_abnt_meses || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  prazo_garantia_abnt_meses: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Ex: 12"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Prazo Garantia Fábrica (meses):
              <input
                type="number"
                value={formData.prazo_garantia_fabrica_meses || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  prazo_garantia_fabrica_meses: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Ex: 24"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Frequência Preventiva (meses):
              <input
                type="number"
                value={formData.frequencia_preventiva_meses || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  frequencia_preventiva_meses: e.target.value ? parseInt(e.target.value) : null 
                })}
                placeholder="Ex: 6"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Regras de Manutenção:
              <textarea
                value={formData.regras_manutencao || ''}
                onChange={(e) => setFormData({ ...formData, regras_manutencao: e.target.value })}
                placeholder="Ex: Manutenção a cada 6 meses"
                rows={4}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              URL do Manual PDF:
              <input
                type="url"
                value={formData.manual_pdf_url || ''}
                onChange={(e) => setFormData({ ...formData, manual_pdf_url: e.target.value })}
                placeholder="https://example.com/manual.pdf"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Salvando...' : isEditando ? 'Atualizar' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
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

### 4. Atualizar a Tela de Listagem de Produtos

**Arquivo:** `src/pages/Produtos.tsx` ou similar

Adicione uma coluna para mostrar o fornecedor na tabela:

```typescript
// Na tabela de produtos, adicione uma coluna:
<th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Fornecedor</th>

// E na linha de cada produto:
<td style={{ padding: '12px' }}>
  {produto.fornecedor ? (
    <div>
      <strong>{produto.fornecedor.nome_fantasia}</strong>
      {produto.fornecedor.cnpj && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          CNPJ: {produto.fornecedor.cnpj}
        </div>
      )}
    </div>
  ) : (
    <span style={{ color: '#999' }}>Sem fornecedor</span>
  )}
</td>
```

---

## 📋 Checklist de Implementação

### Passo 1: Serviços
- [ ] Atualizar `produtoService.ts` para incluir `id_fornecedor` e `fornecedor` nas interfaces
- [ ] Criar/atualizar `fornecedorService.ts` com método `listar()`

### Passo 2: Formulário
- [ ] Adicionar `useEffect` para carregar fornecedores ao abrir o formulário
- [ ] Adicionar campo `<select>` para selecionar fornecedor
- [ ] Adicionar `id_fornecedor` no estado do formulário
- [ ] Incluir `id_fornecedor` ao criar/atualizar produto

### Passo 3: Listagem
- [ ] Adicionar coluna "Fornecedor" na tabela de produtos
- [ ] Exibir nome do fornecedor e CNPJ (se disponível)
- [ ] Mostrar "Sem fornecedor" quando não houver

### Passo 4: Testes
- [ ] Testar criar produto sem fornecedor
- [ ] Testar criar produto com fornecedor
- [ ] Testar editar produto e alterar fornecedor
- [ ] Testar editar produto e remover fornecedor (selecionar "opcional")
- [ ] Verificar se a listagem mostra o fornecedor corretamente

---

## ⚠️ PONTOS IMPORTANTES

1. **Fornecedor é Opcional:** O campo `id_fornecedor` é opcional. O produto pode existir sem fornecedor.

2. **Validação no Backend:** Se `id_fornecedor` for fornecido, o backend valida se o fornecedor existe. Se não existir, retorna erro 400.

3. **Normalização de IDs:** Sempre normalizar `id_fornecedor` e `id_produto` para garantir compatibilidade.

4. **Select de Fornecedores:** O select deve mostrar o `nome_fantasia` do fornecedor. Pode incluir CNPJ para facilitar identificação.

5. **Dados do Fornecedor:** A API retorna os dados do fornecedor junto com o produto em todas as operações (listar, buscar, criar, atualizar).

---

## 🔗 Endpoints Utilizados

- `GET /api/produtos` - Listar produtos (com fornecedor)
- `GET /api/produtos/:id` - Buscar produto (com fornecedor)
- `POST /api/produtos` - Criar produto (com validação de fornecedor)
- `PUT /api/produtos/:id` - Atualizar produto (com validação de fornecedor)
- `DELETE /api/produtos/:id` - Excluir produto
- `GET /api/fornecedores` - Listar fornecedores (para o select)

---

## 🎨 Melhorias Opcionais

### 1. Busca/Filtro por Fornecedor
Adicionar filtro na listagem para mostrar apenas produtos de um fornecedor específico.

### 2. Visualização Detalhada do Fornecedor
Ao clicar no nome do fornecedor na tabela, abrir modal com detalhes completos.

### 3. Indicador Visual
Mostrar ícone ou badge quando o produto tiver fornecedor associado.

---

## ✅ RESUMO

1. **Atualizar serviço** de produtos para incluir `id_fornecedor` e `fornecedor`
2. **Criar/atualizar serviço** de fornecedores para listar (para o select)
3. **Adicionar select** de fornecedores no formulário de produto
4. **Atualizar listagem** para mostrar o fornecedor de cada produto
5. **Testar** todas as funcionalidades

**Tudo pronto para implementar!** 🚀

---

**Última atualização:** Janeiro 2024
