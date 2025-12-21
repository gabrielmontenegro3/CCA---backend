# 🏢 Implementar CRUD de Fornecedor na Tela do Navbar

## 🎯 Objetivo

Implementar funcionalidade completa de CRUD (Criar, Listar, Editar, Excluir) para **Fornecedores** na tela de Fornecedores que está no menu/navbar do sistema.

---

## 📋 Estrutura da Tabela no Banco

```sql
CREATE TABLE fornecedor (
    id_fornecedor SERIAL PRIMARY KEY,
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20),
    area_especialidade VARCHAR(255),
    fornecedor_contato VARCHAR(100)
);
```

**Campos:**
- `id_fornecedor` (PK) - ID único do fornecedor
- `nome_fantasia` (obrigatório) - Nome fantasia do fornecedor
- `cnpj` (opcional) - CNPJ do fornecedor
- `area_especialidade` (opcional) - Área de especialidade
- `fornecedor_contato` (opcional) - Contato do fornecedor

---

## 📍 ONDE IMPLEMENTAR

**Tela:** A tela de Fornecedores que está no menu/navbar do sistema.

**Rota da API:** `http://localhost:3000/api/fornecedores`

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api/fornecedores
```

### 1. Listar Fornecedores

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

### 2. Buscar Fornecedor por ID

**GET** `/api/fornecedores/:id`

**Exemplo:**
```
GET /api/fornecedores/1
```

**Resposta (200):** Mesma estrutura do item da lista acima

### 3. Criar Fornecedor

**POST** `/api/fornecedores`

**Body:**
```json
{
  "nome_fantasia": "Alpha Company",
  "cnpj": "112212121",
  "area_especialidade": "hidraulic",
  "fornecedor_contato": "33333222"
}
```

**Campos obrigatórios:**
- `nome_fantasia` (string)

**Campos opcionais:**
- `cnpj` (string)
- `area_especialidade` (string)
- `fornecedor_contato` (string)

**Resposta (201):**
```json
{
  "id": 1,
  "id_fornecedor": 1,
  "nome_fantasia": "Alpha Company",
  "cnpj": "112212121",
  "area_especialidade": "hidraulic",
  "fornecedor_contato": "33333222"
}
```

### 4. Atualizar Fornecedor

**PUT** `/api/fornecedores/:id`

**Body:**
```json
{
  "nome_fantasia": "Alpha Company Atualizado",
  "cnpj": "112212121",
  "area_especialidade": "hidraulic e elétrica"
}
```

**Nota:** Você pode atualizar qualquer campo, exceto `id` e `id_fornecedor`.

**Resposta (200):** Mesma estrutura da criação

### 5. Excluir Fornecedor

**DELETE** `/api/fornecedores/:id`

**Exemplo:**
```
DELETE /api/fornecedores/1
```

**Resposta (200):**
```json
{
  "message": "Fornecedor removido com sucesso"
}
```

---

## ✅ IMPLEMENTAÇÃO NO FRONT-END

### 1. Criar/Atualizar o Serviço de Fornecedores

**Arquivo:** `src/services/fornecedorService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export interface Fornecedor {
  id: number; // ID do fornecedor (id_fornecedor)
  id_fornecedor: number; // Mesmo que id (normalizado)
  nome_fantasia: string; // OBRIGATÓRIO
  cnpj?: string | null;
  area_especialidade?: string | null;
  fornecedor_contato?: string | null;
}

export interface CriarFornecedorDTO {
  nome_fantasia: string;
  cnpj?: string | null;
  area_especialidade?: string | null;
  fornecedor_contato?: string | null;
}

export interface AtualizarFornecedorDTO {
  nome_fantasia?: string;
  cnpj?: string | null;
  area_especialidade?: string | null;
  fornecedor_contato?: string | null;
}

export const fornecedorService = {
  // Listar todos os fornecedores
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

  // Buscar fornecedor por ID
  buscarPorId: async (id: number): Promise<Fornecedor> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar fornecedor');
    }

    const fornecedor = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    };
  },

  // Criar fornecedor
  criar: async (dados: CriarFornecedorDTO): Promise<Fornecedor> => {
    if (!dados.nome_fantasia) {
      throw new Error('nome_fantasia é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/fornecedores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar fornecedor');
    }

    const fornecedor = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    };
  },

  // Atualizar fornecedor
  atualizar: async (id: number, dados: AtualizarFornecedorDTO): Promise<Fornecedor> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar fornecedor');
    }

    const fornecedor = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    };
  },

  // Remover fornecedor
  remover: async (id: number): Promise<void> => {
    if (!id || id === 0) {
      throw new Error('ID do fornecedor é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/fornecedores/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover fornecedor');
    }
  },
};
```

---

### 2. Atualizar a Tela de Fornecedores (Componente Principal)

**Arquivo:** `src/pages/Fornecedores.tsx` ou `src/components/Fornecedores.tsx` (onde está a tela do navbar)

```typescript
import React, { useState, useEffect } from 'react';
import { fornecedorService, Fornecedor } from '../services/fornecedorService';
import FornecedorForm from '../components/FornecedorForm'; // Criar este componente

const FornecedoresPage: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<Fornecedor | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    carregarFornecedores();
  }, []);

  const carregarFornecedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await fornecedorService.listar();
      setFornecedores(dados);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = () => {
    setFornecedorEditando(null);
    setShowForm(true);
  };

  const handleEditar = (fornecedor: Fornecedor) => {
    // ✅ Normalizar ID
    const fornecedorNormalizado = {
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    };
    setFornecedorEditando(fornecedorNormalizado);
    setShowForm(true);
  };

  const handleExcluir = (fornecedor: Fornecedor) => {
    // ✅ Normalizar ID
    const fornecedorNormalizado = {
      ...fornecedor,
      id: fornecedor.id || fornecedor.id_fornecedor,
      id_fornecedor: fornecedor.id_fornecedor || fornecedor.id,
    };
    setFornecedorParaExcluir(fornecedorNormalizado);
    setShowConfirmModal(true);
  };

  const confirmarExclusao = async () => {
    if (!fornecedorParaExcluir || !fornecedorParaExcluir.id) {
      alert('Erro: ID do fornecedor não encontrado');
      return;
    }

    try {
      setExcluindo(true);
      await fornecedorService.remover(fornecedorParaExcluir.id);
      await carregarFornecedores();
      setShowConfirmModal(false);
      setFornecedorParaExcluir(null);
      alert('✅ Fornecedor excluído com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir fornecedor: ' + err.message);
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando fornecedores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Erro: {error}</p>
        <button onClick={carregarFornecedores}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px' 
      }}>
        <h1>Fornecedores</h1>
        <button
          onClick={handleCriar}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          + Novo Fornecedor
        </button>
      </div>

      {/* Tabela de Fornecedores */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Nome Fantasia</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>CNPJ</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Área Especialidade</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Contato</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map((fornecedor) => (
              <tr key={fornecedor.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{fornecedor.id}</td>
                <td style={{ padding: '12px' }}>{fornecedor.nome_fantasia}</td>
                <td style={{ padding: '12px' }}>{fornecedor.cnpj || '-'}</td>
                <td style={{ padding: '12px' }}>{fornecedor.area_especialidade || '-'}</td>
                <td style={{ padding: '12px' }}>{fornecedor.fornecedor_contato || '-'}</td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => handleEditar(fornecedor)}
                    style={{ 
                      marginRight: '5px', 
                      padding: '5px 10px', 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(fornecedor)}
                    style={{ 
                      padding: '5px 10px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fornecedores.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <p>Nenhum fornecedor encontrado.</p>
          <button
            onClick={handleCriar}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Criar Primeiro Fornecedor
          </button>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <FornecedorForm
          fornecedor={fornecedorEditando}
          onClose={() => {
            setShowForm(false);
            setFornecedorEditando(null);
          }}
          onSuccess={carregarFornecedores}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmModal && fornecedorParaExcluir && (
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
          onClick={() => {
            setShowConfirmModal(false);
            setFornecedorParaExcluir(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja excluir o fornecedor{' '}
              <strong>{fornecedorParaExcluir.nome_fantasia}</strong>?
            </p>
            <p style={{ color: '#dc3545', fontSize: '14px', marginTop: '10px' }}>
              ⚠️ Esta ação não pode ser desfeita!
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={confirmarExclusao}
                disabled={excluindo}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: excluindo ? 'not-allowed' : 'pointer',
                  opacity: excluindo ? 0.6 : 1,
                }}
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setFornecedorParaExcluir(null);
                }}
                disabled={excluindo}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: excluindo ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FornecedoresPage;
```

---

### 3. Criar Componente de Formulário

**Arquivo:** `src/components/FornecedorForm.tsx`

```typescript
import React, { useState } from 'react';
import { fornecedorService, Fornecedor, CriarFornecedorDTO, AtualizarFornecedorDTO } from '../services/fornecedorService';

interface FornecedorFormProps {
  fornecedor?: Fornecedor | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FornecedorForm: React.FC<FornecedorFormProps> = ({ fornecedor, onClose, onSuccess }) => {
  const [nomeFantasia, setNomeFantasia] = useState<string>(fornecedor?.nome_fantasia || '');
  const [cnpj, setCnpj] = useState<string>(fornecedor?.cnpj || '');
  const [areaEspecialidade, setAreaEspecialidade] = useState<string>(fornecedor?.area_especialidade || '');
  const [fornecedorContato, setFornecedorContato] = useState<string>(fornecedor?.fornecedor_contato || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditando = !!fornecedor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nomeFantasia.trim()) {
      setError('Nome Fantasia é obrigatório');
      return;
    }

    try {
      setLoading(true);

      if (isEditando) {
        // Atualizar
        const dados: AtualizarFornecedorDTO = {
          nome_fantasia: nomeFantasia.trim(),
          cnpj: cnpj.trim() || null,
          area_especialidade: areaEspecialidade.trim() || null,
          fornecedor_contato: fornecedorContato.trim() || null,
        };

        await fornecedorService.atualizar(fornecedor!.id, dados);
        alert('✅ Fornecedor atualizado com sucesso!');
      } else {
        // Criar
        const dados: CriarFornecedorDTO = {
          nome_fantasia: nomeFantasia.trim(),
          cnpj: cnpj.trim() || null,
          area_especialidade: areaEspecialidade.trim() || null,
          fornecedor_contato: fornecedorContato.trim() || null,
        };

        await fornecedorService.criar(dados);
        alert('✅ Fornecedor criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar fornecedor:', err);
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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>

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
          <div style={{ marginBottom: '15px' }}>
            <label>
              Nome Fantasia *:
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                required
                placeholder="Ex: Alpha Company"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              CNPJ:
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="Ex: 112212121"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Área de Especialidade:
              <input
                type="text"
                value={areaEspecialidade}
                onChange={(e) => setAreaEspecialidade(e.target.value)}
                placeholder="Ex: hidraulic, elétrica, etc"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Contato do Fornecedor:
              <input
                type="text"
                value={fornecedorContato}
                onChange={(e) => setFornecedorContato(e.target.value)}
                placeholder="Ex: 33333222"
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

export default FornecedorForm;
```

---

## 📋 Checklist de Implementação

### Passo 1: Serviço
- [ ] Criar/atualizar `src/services/fornecedorService.ts`
- [ ] Implementar todos os métodos (listar, buscarPorId, criar, atualizar, remover)
- [ ] Adicionar normalização de IDs (`id_fornecedor` → `id`)

### Passo 2: Componente Principal
- [ ] Localizar a tela de Fornecedores no navbar
- [ ] Atualizar o componente para usar o `fornecedorService`
- [ ] Adicionar estado para lista de fornecedores
- [ ] Adicionar função `carregarFornecedores()`
- [ ] Adicionar botão "Novo Fornecedor"
- [ ] Adicionar botões "Editar" e "Excluir" na tabela
- [ ] Adicionar tratamento de erros

### Passo 3: Formulário
- [ ] Criar componente `FornecedorForm.tsx`
- [ ] Implementar modo criar
- [ ] Implementar modo editar
- [ ] Adicionar validações (nome_fantasia obrigatório)
- [ ] Adicionar tratamento de erros

### Passo 4: Modal de Confirmação
- [ ] Adicionar modal de confirmação para exclusão
- [ ] Implementar função `confirmarExclusao()`

### Passo 5: Testes
- [ ] Testar listar fornecedores
- [ ] Testar criar fornecedor
- [ ] Testar editar fornecedor
- [ ] Testar excluir fornecedor

---

## ⚠️ PONTOS IMPORTANTES

1. **Normalização de IDs:** Sempre normalizar `id_fornecedor` para `id` antes de usar.

2. **Validações:** 
   - `nome_fantasia` é obrigatório na criação
   - Todos os outros campos são opcionais

3. **Campos Obrigatórios:**
   - `nome_fantasia` (string) - OBRIGATÓRIO

4. **Campos Opcionais:**
   - `cnpj` (string)
   - `area_especialidade` (string)
   - `fornecedor_contato` (string)

5. **Erros Comuns:**
   - Se receber erro 400: Verificar se `nome_fantasia` foi enviado
   - Se receber erro 404: Fornecedor não encontrado

---

## 🔗 Endpoints da API

- `GET /api/fornecedores` - Listar todas
- `GET /api/fornecedores/:id` - Buscar por ID
- `POST /api/fornecedores` - Criar
- `PUT /api/fornecedores/:id` - Atualizar
- `DELETE /api/fornecedores/:id` - Excluir

---

## 🎨 Melhorias Opcionais

### 1. Máscara para CNPJ
```typescript
const formatarCNPJ = (cnpj: string) => {
  return cnpj.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};
```

### 2. Busca/Filtro
Adicionar campo de busca para filtrar fornecedores por nome, CNPJ, etc.

### 3. Validação de CNPJ
Adicionar validação de CNPJ no front-end antes de enviar.

---

## ✅ RESUMO

1. **Criar serviço** `fornecedorService.ts` com todos os métodos CRUD
2. **Atualizar tela** de Fornecedores para usar o serviço
3. **Criar formulário** `FornecedorForm.tsx` para criar/editar
4. **Adicionar modais** de confirmação para exclusão
5. **Testar** todas as funcionalidades

**Tudo pronto para implementar na tela de Fornecedores do navbar!** 🚀

---

**Última atualização:** Janeiro 2024



