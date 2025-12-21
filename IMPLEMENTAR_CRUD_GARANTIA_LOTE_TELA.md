# 🛡️ Implementar CRUD de Garantia de Lote na Tela do Sidebar

## 🎯 Objetivo

Implementar funcionalidade completa de CRUD (Criar, Listar, Editar, Excluir) para **Garantia de Lote** na tela de Garantias que está no menu/sidebar do sistema.

**IMPORTANTE:** Esta é a nova funcionalidade que substitui a anterior. Use a tabela `Garantia_Lote` do banco de dados.

---

## 📋 Estrutura da Tabela no Banco

```sql
CREATE TABLE Garantia_Lote (
    id_garantia_lote SERIAL PRIMARY KEY,
    id_produto INTEGER REFERENCES Produto(id_produto) NOT NULL,
    id_fornecedor INTEGER REFERENCES Fornecedor(id_fornecedor),
    data_compra DATE NOT NULL,
    id_garantia VARCHAR(100),
    tempo_garantia_fabricante_meses INTEGER,
    id_contato INTEGER REFERENCES Contato(id_contato)
);
```

---

## 📍 ONDE IMPLEMENTAR

**Tela:** A tela de Garantias que está no menu/sidebar do sistema.

**Rota da API:** `http://localhost:3000/api/garantia-lote`

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api/garantia-lote
```

### 1. Listar Garantias de Lote

**GET** `/api/garantia-lote`

**Query Parameters (opcionais):**
- `id_produto` - Filtrar por produto
- `id_fornecedor` - Filtrar por fornecedor
- `id_contato` - Filtrar por contato

**Exemplo:**
```typescript
// Listar todas
GET /api/garantia-lote

// Filtrar por produto
GET /api/garantia-lote?id_produto=5

// Filtrar por fornecedor
GET /api/garantia-lote?id_fornecedor=2
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "id_garantia_lote": 1,
    "id_produto": 5,
    "id_fornecedor": 2,
    "data_compra": "2024-01-15",
    "id_garantia": "GAR-001234",
    "tempo_garantia_fabricante_meses": 24,
    "id_contato": 3,
    "Produto": {
      "id": 5,
      "nome_produto": "Ar Condicionado Split",
      "codigo_sku": "AC-001"
    },
    "Fornecedor": {
      "id": 2,
      "nome_fornecedor": "Fornecedor XYZ"
    },
    "Contato": {
      "id": 3,
      "nome": "João Silva",
      "telefone": "(11) 99999-9999"
    }
  }
]
```

### 2. Buscar Garantia de Lote por ID

**GET** `/api/garantia-lote/:id`

**Exemplo:**
```
GET /api/garantia-lote/1
```

**Resposta (200):** Mesma estrutura do item da lista acima

### 3. Criar Garantia de Lote

**POST** `/api/garantia-lote`

**Body:**
```json
{
  "id_produto": 5,
  "id_fornecedor": 2,
  "data_compra": "2024-01-15",
  "id_garantia": "GAR-001234",
  "tempo_garantia_fabricante_meses": 24,
  "id_contato": 3
}
```

**Campos obrigatórios:**
- `id_produto` (number)
- `data_compra` (string, formato YYYY-MM-DD)

**Campos opcionais:**
- `id_fornecedor` (number)
- `id_garantia` (string)
- `tempo_garantia_fabricante_meses` (number)
- `id_contato` (number)

**Resposta (201):**
```json
{
  "id": 1,
  "id_garantia_lote": 1,
  "id_produto": 5,
  "id_fornecedor": 2,
  "data_compra": "2024-01-15",
  "id_garantia": "GAR-001234",
  "tempo_garantia_fabricante_meses": 24,
  "id_contato": 3,
  "Produto": { ... },
  "Fornecedor": { ... },
  "Contato": { ... }
}
```

### 4. Atualizar Garantia de Lote

**PUT** `/api/garantia-lote/:id`

**Body:**
```json
{
  "data_compra": "2024-02-01",
  "id_garantia": "GAR-001235",
  "tempo_garantia_fabricante_meses": 36
}
```

**Nota:** Você pode atualizar qualquer campo, exceto `id` e `id_garantia_lote`.

**Resposta (200):** Mesma estrutura da criação

### 5. Excluir Garantia de Lote

**DELETE** `/api/garantia-lote/:id`

**Exemplo:**
```
DELETE /api/garantia-lote/1
```

**Resposta (200):**
```json
{
  "message": "Garantia de lote removida com sucesso"
}
```

---

## ✅ IMPLEMENTAÇÃO NO FRONT-END

### 1. Criar/Atualizar o Serviço de Garantia de Lote

**Arquivo:** `src/services/garantiaLoteService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export interface GarantiaLote {
  id: number; // ID da garantia (id_garantia_lote)
  id_garantia_lote: number; // Mesmo que id (normalizado)
  id_produto: number; // ID do produto - OBRIGATÓRIO
  id_fornecedor?: number | null; // ID do fornecedor (opcional)
  data_compra: string; // Data da compra (YYYY-MM-DD) - OBRIGATÓRIO
  id_garantia?: string | null; // ID de rastreio/número de série
  tempo_garantia_fabricante_meses?: number | null; // Tempo de garantia em meses
  id_contato?: number | null; // ID do contato técnico/vendedor
  
  // Dados relacionados (enviados pelo backend)
  Produto?: {
    id: number;
    nome_produto: string;
    codigo_sku: string;
  };
  Fornecedor?: {
    id: number;
    nome_fornecedor: string;
  };
  Contato?: {
    id: number;
    nome: string;
    telefone?: string;
    email?: string;
  };
}

export interface CriarGarantiaLoteDTO {
  id_produto: number;
  id_fornecedor?: number | null;
  data_compra: string;
  id_garantia?: string | null;
  tempo_garantia_fabricante_meses?: number | null;
  id_contato?: number | null;
}

export interface AtualizarGarantiaLoteDTO {
  id_produto?: number;
  id_fornecedor?: number | null;
  data_compra?: string;
  id_garantia?: string | null;
  tempo_garantia_fabricante_meses?: number | null;
  id_contato?: number | null;
}

export const garantiaLoteService = {
  // Listar todas as garantias de lote
  listar: async (filtros?: {
    id_produto?: number;
    id_fornecedor?: number;
    id_contato?: number;
  }): Promise<GarantiaLote[]> => {
    const params = new URLSearchParams();
    if (filtros?.id_produto) {
      params.append('id_produto', filtros.id_produto.toString());
    }
    if (filtros?.id_fornecedor) {
      params.append('id_fornecedor', filtros.id_fornecedor.toString());
    }
    if (filtros?.id_contato) {
      params.append('id_contato', filtros.id_contato.toString());
    }

    const url = `${API_BASE_URL}/garantia-lote${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar garantias de lote');
    }

    const dados = await response.json();
    
    // ✅ Normalizar IDs
    return dados.map((garantia: any) => ({
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    }));
  },

  // Buscar garantia de lote por ID
  buscarPorId: async (id: number): Promise<GarantiaLote> => {
    const response = await fetch(`${API_BASE_URL}/garantia-lote/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar garantia de lote');
    }

    const garantia = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    };
  },

  // Criar garantia de lote
  criar: async (dados: CriarGarantiaLoteDTO): Promise<GarantiaLote> => {
    if (!dados.id_produto || !dados.data_compra) {
      throw new Error('id_produto e data_compra são obrigatórios');
    }

    const response = await fetch(`${API_BASE_URL}/garantia-lote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar garantia de lote');
    }

    const garantia = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    };
  },

  // Atualizar garantia de lote
  atualizar: async (id: number, dados: AtualizarGarantiaLoteDTO): Promise<GarantiaLote> => {
    const response = await fetch(`${API_BASE_URL}/garantia-lote/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar garantia de lote');
    }

    const garantia = await response.json();
    
    // ✅ Normalizar ID
    return {
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    };
  },

  // Remover garantia de lote
  remover: async (id: number): Promise<void> => {
    if (!id || id === 0) {
      throw new Error('ID da garantia de lote é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/garantia-lote/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover garantia de lote');
    }
  },
};
```

---

### 2. Atualizar a Tela de Garantias (Componente Principal)

**Arquivo:** `src/pages/Garantias.tsx` ou `src/components/Garantias.tsx` (onde está a tela do sidebar)

```typescript
import React, { useState, useEffect } from 'react';
import { garantiaLoteService, GarantiaLote } from '../services/garantiaLoteService';
import GarantiaLoteForm from '../components/GarantiaLoteForm'; // Criar este componente

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<GarantiaLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [garantiaEditando, setGarantiaEditando] = useState<GarantiaLote | null>(null);
  const [garantiaParaExcluir, setGarantiaParaExcluir] = useState<GarantiaLote | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Filtros
  const [filtroProduto, setFiltroProduto] = useState<number | null>(null);
  const [filtroFornecedor, setFiltroFornecedor] = useState<number | null>(null);

  useEffect(() => {
    carregarGarantias();
  }, [filtroProduto, filtroFornecedor]);

  const carregarGarantias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros: any = {};
      if (filtroProduto) filtros.id_produto = filtroProduto;
      if (filtroFornecedor) filtros.id_fornecedor = filtroFornecedor;

      const dados = await garantiaLoteService.listar(filtros);
      setGarantias(dados);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao carregar garantias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = () => {
    setGarantiaEditando(null);
    setShowForm(true);
  };

  const handleEditar = (garantia: GarantiaLote) => {
    // ✅ Normalizar ID
    const garantiaNormalizada = {
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    };
    setGarantiaEditando(garantiaNormalizada);
    setShowForm(true);
  };

  const handleExcluir = (garantia: GarantiaLote) => {
    // ✅ Normalizar ID
    const garantiaNormalizada = {
      ...garantia,
      id: garantia.id || garantia.id_garantia_lote,
      id_garantia_lote: garantia.id_garantia_lote || garantia.id,
    };
    setGarantiaParaExcluir(garantiaNormalizada);
    setShowConfirmModal(true);
  };

  const confirmarExclusao = async () => {
    if (!garantiaParaExcluir || !garantiaParaExcluir.id) {
      alert('Erro: ID da garantia não encontrado');
      return;
    }

    try {
      setExcluindo(true);
      await garantiaLoteService.remover(garantiaParaExcluir.id);
      await carregarGarantias();
      setShowConfirmModal(false);
      setGarantiaParaExcluir(null);
      alert('✅ Garantia de lote excluída com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir garantia: ' + err.message);
    } finally {
      setExcluindo(false);
    }
  };

  const formatarData = (data?: string | null) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando garantias de lote...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Erro: {error}</p>
        <button onClick={carregarGarantias}>Tentar novamente</button>
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
        <h1>Garantias de Lote</h1>
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
          + Nova Garantia de Lote
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <input
          type="number"
          placeholder="Filtrar por Produto ID"
          value={filtroProduto || ''}
          onChange={(e) => setFiltroProduto(e.target.value ? parseInt(e.target.value) : null)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="number"
          placeholder="Filtrar por Fornecedor ID"
          value={filtroFornecedor || ''}
          onChange={(e) => setFiltroFornecedor(e.target.value ? parseInt(e.target.value) : null)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button 
          onClick={() => { setFiltroProduto(null); setFiltroFornecedor(null); }}
          style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Limpar Filtros
        </button>
      </div>

      {/* Tabela de Garantias */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Produto</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Fornecedor</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Data Compra</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>ID Garantia</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Tempo (meses)</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Contato</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {garantias.map((garantia) => (
              <tr key={garantia.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{garantia.id}</td>
                <td style={{ padding: '12px' }}>
                  {garantia.Produto?.nome_produto || garantia.id_produto}
                </td>
                <td style={{ padding: '12px' }}>
                  {garantia.Fornecedor?.nome_fornecedor || garantia.id_fornecedor || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatarData(garantia.data_compra)}
                </td>
                <td style={{ padding: '12px' }}>
                  {garantia.id_garantia || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {garantia.tempo_garantia_fabricante_meses ? `${garantia.tempo_garantia_fabricante_meses} meses` : '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  {garantia.Contato?.nome || garantia.id_contato || '-'}
                </td>
                <td style={{ padding: '12px' }}>
                  <button 
                    onClick={() => handleEditar(garantia)}
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
                    onClick={() => handleExcluir(garantia)}
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

      {garantias.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <p>Nenhuma garantia de lote encontrada.</p>
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
            Criar Primeira Garantia de Lote
          </button>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <GarantiaLoteForm
          garantia={garantiaEditando}
          onClose={() => {
            setShowForm(false);
            setGarantiaEditando(null);
          }}
          onSuccess={carregarGarantias}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmModal && garantiaParaExcluir && (
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
            setGarantiaParaExcluir(null);
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
              Tem certeza que deseja excluir a garantia de lote do produto{' '}
              <strong>{garantiaParaExcluir.Produto?.nome_produto || garantiaParaExcluir.id_produto}</strong>?
            </p>
            {garantiaParaExcluir.id_garantia && (
              <p>
                <strong>ID Garantia:</strong> {garantiaParaExcluir.id_garantia}
              </p>
            )}
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
                  setGarantiaParaExcluir(null);
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

export default GarantiasPage;
```

---

### 3. Criar Componente de Formulário

**Arquivo:** `src/components/GarantiaLoteForm.tsx`

```typescript
import React, { useState } from 'react';
import { garantiaLoteService, GarantiaLote, CriarGarantiaLoteDTO, AtualizarGarantiaLoteDTO } from '../services/garantiaLoteService';

interface GarantiaLoteFormProps {
  garantia?: GarantiaLote | null;
  onClose: () => void;
  onSuccess: () => void;
}

const GarantiaLoteForm: React.FC<GarantiaLoteFormProps> = ({ garantia, onClose, onSuccess }) => {
  const [idProduto, setIdProduto] = useState<number>(garantia?.id_produto || 0);
  const [idFornecedor, setIdFornecedor] = useState<number | null>(garantia?.id_fornecedor || null);
  const [dataCompra, setDataCompra] = useState<string>(
    garantia?.data_compra || ''
  );
  const [idGarantia, setIdGarantia] = useState<string>(
    garantia?.id_garantia || ''
  );
  const [tempoGarantiaMeses, setTempoGarantiaMeses] = useState<number | null>(
    garantia?.tempo_garantia_fabricante_meses || null
  );
  const [idContato, setIdContato] = useState<number | null>(garantia?.id_contato || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditando = !!garantia;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);

      if (isEditando) {
        // Atualizar
        const dados: AtualizarGarantiaLoteDTO = {
          id_produto: idProduto || undefined,
          id_fornecedor: idFornecedor || null,
          data_compra: dataCompra || undefined,
          id_garantia: idGarantia || null,
          tempo_garantia_fabricante_meses: tempoGarantiaMeses || null,
          id_contato: idContato || null,
        };

        // Remover campos undefined
        Object.keys(dados).forEach(key => {
          if (dados[key as keyof AtualizarGarantiaLoteDTO] === undefined) {
            delete dados[key as keyof AtualizarGarantiaLoteDTO];
          }
        });

        await garantiaLoteService.atualizar(garantia!.id, dados);
        alert('✅ Garantia de lote atualizada com sucesso!');
      } else {
        // Criar
        if (!idProduto || !dataCompra) {
          throw new Error('Produto e Data de Compra são obrigatórios');
        }

        const dados: CriarGarantiaLoteDTO = {
          id_produto: idProduto,
          id_fornecedor: idFornecedor || null,
          data_compra: dataCompra,
          id_garantia: idGarantia || null,
          tempo_garantia_fabricante_meses: tempoGarantiaMeses || null,
          id_contato: idContato || null,
        };

        await garantiaLoteService.criar(dados);
        alert('✅ Garantia de lote criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar garantia de lote:', err);
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
        <h2>{isEditando ? 'Editar Garantia de Lote' : 'Nova Garantia de Lote'}</h2>

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
              ID do Produto *:
              <input
                type="number"
                value={idProduto || ''}
                onChange={(e) => setIdProduto(parseInt(e.target.value) || 0)}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              ID do Fornecedor (opcional):
              <input
                type="number"
                value={idFornecedor || ''}
                onChange={(e) => setIdFornecedor(e.target.value ? parseInt(e.target.value) : null)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Data de Compra *:
              <input
                type="date"
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Data da Nota Fiscal
              </small>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              ID de Garantia / Número de Série (opcional):
              <input
                type="text"
                value={idGarantia}
                onChange={(e) => setIdGarantia(e.target.value)}
                placeholder="Ex: GAR-001234"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Número de rastreio ou série de garantia do fabricante
              </small>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Tempo de Garantia do Fabricante (meses) (opcional):
              <input
                type="number"
                value={tempoGarantiaMeses || ''}
                onChange={(e) => setTempoGarantiaMeses(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Ex: 24"
                min="0"
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Tempo de garantia oferecido para este lote/compra
              </small>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              ID do Contato (opcional):
              <input
                type="number"
                value={idContato || ''}
                onChange={(e) => setIdContato(e.target.value ? parseInt(e.target.value) : null)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Técnico/vendedor de suporte
              </small>
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

export default GarantiaLoteForm;
```

---

## 📋 Checklist de Implementação

### Passo 1: Serviço
- [ ] Criar `src/services/garantiaLoteService.ts`
- [ ] Implementar todos os métodos (listar, buscarPorId, criar, atualizar, remover)
- [ ] Adicionar normalização de IDs

### Passo 2: Componente Principal
- [ ] Localizar a tela de Garantias no sidebar
- [ ] Substituir/atualizar o componente para usar `garantiaLoteService`
- [ ] Adicionar estado para lista de garantias
- [ ] Adicionar função `carregarGarantias()`
- [ ] Adicionar botão "Nova Garantia de Lote"
- [ ] Adicionar botões "Editar" e "Excluir" na tabela
- [ ] Adicionar filtros (produto, fornecedor)
- [ ] Adicionar tratamento de erros

### Passo 3: Formulário
- [ ] Criar componente `GarantiaLoteForm.tsx`
- [ ] Implementar modo criar
- [ ] Implementar modo editar
- [ ] Adicionar validações (produto e data_compra obrigatórios)
- [ ] Adicionar tratamento de erros

### Passo 4: Modal de Confirmação
- [ ] Adicionar modal de confirmação para exclusão
- [ ] Implementar função `confirmarExclusao()`

### Passo 5: Testes
- [ ] Testar listar garantias
- [ ] Testar criar garantia
- [ ] Testar editar garantia
- [ ] Testar excluir garantia
- [ ] Testar filtros

---

## ⚠️ PONTOS IMPORTANTES

1. **Normalização de IDs:** Sempre normalizar `id_garantia_lote` para `id` antes de usar.

2. **Validações:** 
   - `id_produto` e `data_compra` são obrigatórios na criação
   - Todos os outros campos são opcionais

3. **Campos Obrigatórios:**
   - `id_produto` (number) - OBRIGATÓRIO
   - `data_compra` (string, YYYY-MM-DD) - OBRIGATÓRIO

4. **Campos Opcionais:**
   - `id_fornecedor` (number)
   - `id_garantia` (string) - Número de série/rastreio
   - `tempo_garantia_fabricante_meses` (number)
   - `id_contato` (number)

---

## 🔗 Endpoints da API

- `GET /api/garantia-lote` - Listar todas
- `GET /api/garantia-lote/:id` - Buscar por ID
- `POST /api/garantia-lote` - Criar
- `PUT /api/garantia-lote/:id` - Atualizar
- `DELETE /api/garantia-lote/:id` - Excluir

---

## ✅ RESUMO

1. **Criar serviço** `garantiaLoteService.ts` com todos os métodos CRUD
2. **Atualizar tela** de Garantias para usar o novo serviço
3. **Criar formulário** `GarantiaLoteForm.tsx` para criar/editar
4. **Adicionar modais** de confirmação para exclusão
5. **Testar** todas as funcionalidades

**Tudo pronto para implementar na tela de Garantias do sidebar!** 🚀

---

**Última atualização:** Janeiro 2024
