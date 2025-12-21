# 🛡️ Implementar CRUD de Garantias na Tela do Sidebar

## 🎯 Objetivo

Implementar funcionalidade completa de CRUD (Criar, Listar, Editar, Excluir) na **tela de Garantias** que já existe no sidebar do sistema.

---

## 📍 ONDE IMPLEMENTAR

**Tela:** A tela de Garantias que está no menu/sidebar do sistema.

**Rota da API:** `http://localhost:3000/api/garantias`

---

## ✅ PASSO A PASSO DE IMPLEMENTAÇÃO

### 1. Criar/Atualizar o Serviço de Garantias

**Arquivo:** `src/services/garantiaService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export interface Garantia {
  id: number;
  id_unidade: number;
  id_produto: number;
  data_instalacao?: string | null;
  data_base?: string;
  data_fim_garantia_abnt?: string | null;
  data_fim_garantia_fabrica?: string | null;
  status_garantia_abnt?: 'VALIDA' | 'EXPIRADA' | null;
  status_garantia_fabrica?: 'VALIDA' | 'EXPIRADA' | null;
  Unidade?: {
    id: number;
    numero_unidade: string;
  };
  Produto?: {
    id: number;
    nome_produto: string;
    codigo_sku: string;
  };
  Empreendimento?: {
    id: number;
    nome_empreendimento: string;
  };
}

export interface CriarGarantiaDTO {
  id_unidade: number;
  id_produto: number;
  data_instalacao?: string | null;
}

export interface AtualizarGarantiaDTO {
  data_instalacao?: string | null;
}

export const garantiaService = {
  // Listar todas as garantias
  listar: async (filtros?: { id_unidade?: number; id_produto?: number }): Promise<Garantia[]> => {
    const params = new URLSearchParams();
    if (filtros?.id_unidade) params.append('id_unidade', filtros.id_unidade.toString());
    if (filtros?.id_produto) params.append('id_produto', filtros.id_produto.toString());

    const url = `${API_BASE_URL}/garantias${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar garantias');
    }

    const dados = await response.json();
    
    // ✅ Normalizar IDs
    return dados.map((garantia: any) => ({
      ...garantia,
      id: garantia.id || garantia.id_unidade_produto_garantia,
    }));
  },

  // Buscar garantia por ID
  buscarPorId: async (id: number): Promise<Garantia> => {
    const response = await fetch(`${API_BASE_URL}/garantias/${id}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar garantia');
    }

    const garantia = await response.json();
    return {
      ...garantia,
      id: garantia.id || garantia.id_unidade_produto_garantia,
    };
  },

  // Criar garantia
  criar: async (dados: CriarGarantiaDTO): Promise<Garantia> => {
    if (!dados.id_unidade || !dados.id_produto) {
      throw new Error('id_unidade e id_produto são obrigatórios');
    }

    const response = await fetch(`${API_BASE_URL}/garantias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar garantia');
    }

    const garantia = await response.json();
    return {
      ...garantia,
      id: garantia.id || garantia.id_unidade_produto_garantia,
    };
  },

  // Atualizar garantia
  atualizar: async (id: number, dados: AtualizarGarantiaDTO): Promise<Garantia> => {
    const response = await fetch(`${API_BASE_URL}/garantias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar garantia');
    }

    const garantia = await response.json();
    return {
      ...garantia,
      id: garantia.id || garantia.id_unidade_produto_garantia,
    };
  },

  // Remover garantia
  remover: async (id: number): Promise<void> => {
    if (!id || id === 0) {
      throw new Error('ID da garantia é obrigatório');
    }

    const response = await fetch(`${API_BASE_URL}/garantias/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao remover garantia');
    }
  },
};
```

---

### 2. Atualizar a Tela de Garantias (Componente Principal)

**Arquivo:** `src/pages/Garantias.tsx` ou `src/components/Garantias.tsx` (onde está a tela do sidebar)

```typescript
import React, { useState, useEffect } from 'react';
import { garantiaService, Garantia } from '../services/garantiaService';
import GarantiaForm from '../components/GarantiaForm'; // Criar este componente

const GarantiasPage: React.FC = () => {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [garantiaEditando, setGarantiaEditando] = useState<Garantia | null>(null);
  const [garantiaParaExcluir, setGarantiaParaExcluir] = useState<Garantia | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Filtros
  const [filtroUnidade, setFiltroUnidade] = useState<number | null>(null);
  const [filtroProduto, setFiltroProduto] = useState<number | null>(null);

  useEffect(() => {
    carregarGarantias();
  }, [filtroUnidade, filtroProduto]);

  const carregarGarantias = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros: any = {};
      if (filtroUnidade) filtros.id_unidade = filtroUnidade;
      if (filtroProduto) filtros.id_produto = filtroProduto;

      const dados = await garantiaService.listar(filtros);
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

  const handleEditar = (garantia: Garantia) => {
    // ✅ Normalizar ID
    const garantiaNormalizada = {
      ...garantia,
      id: garantia.id || (garantia as any).id_unidade_produto_garantia,
    };
    setGarantiaEditando(garantiaNormalizada);
    setShowForm(true);
  };

  const handleExcluir = (garantia: Garantia) => {
    // ✅ Normalizar ID
    const garantiaNormalizada = {
      ...garantia,
      id: garantia.id || (garantia as any).id_unidade_produto_garantia,
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
      await garantiaService.remover(garantiaParaExcluir.id);
      await carregarGarantias();
      setShowConfirmModal(false);
      setGarantiaParaExcluir(null);
      alert('✅ Garantia excluída com sucesso!');
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

  const getStatusBadge = (status?: string | null) => {
    if (status === 'VALIDA') {
      return (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: '#28a745', 
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✓ VÁLIDA
        </span>
      );
    }
    if (status === 'EXPIRADA') {
      return (
        <span style={{ 
          padding: '4px 8px', 
          borderRadius: '4px', 
          backgroundColor: '#dc3545', 
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          ✗ EXPIRADA
        </span>
      );
    }
    return <span style={{ color: 'gray' }}>-</span>;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Carregando garantias...</p>
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
        <h1>Garantias</h1>
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
          + Nova Garantia
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
          placeholder="Filtrar por Unidade ID"
          value={filtroUnidade || ''}
          onChange={(e) => setFiltroUnidade(e.target.value ? parseInt(e.target.value) : null)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <input
          type="number"
          placeholder="Filtrar por Produto ID"
          value={filtroProduto || ''}
          onChange={(e) => setFiltroProduto(e.target.value ? parseInt(e.target.value) : null)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
        <button 
          onClick={() => { setFiltroUnidade(null); setFiltroProduto(null); }}
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
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Unidade</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Produto</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Data Instalação</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Data Base</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Fim ABNT</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status ABNT</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Fim Fábrica</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Status Fábrica</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {garantias.map((garantia) => (
              <tr key={garantia.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{garantia.id}</td>
                <td style={{ padding: '12px' }}>
                  {garantia.Unidade?.numero_unidade || garantia.id_unidade}
                </td>
                <td style={{ padding: '12px' }}>
                  {garantia.Produto?.nome_produto || garantia.id_produto}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatarData(garantia.data_instalacao)}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatarData(garantia.data_base)}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatarData(garantia.data_fim_garantia_abnt)}
                </td>
                <td style={{ padding: '12px' }}>
                  {getStatusBadge(garantia.status_garantia_abnt)}
                </td>
                <td style={{ padding: '12px' }}>
                  {formatarData(garantia.data_fim_garantia_fabrica)}
                </td>
                <td style={{ padding: '12px' }}>
                  {getStatusBadge(garantia.status_garantia_fabrica)}
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
          <p>Nenhuma garantia encontrada.</p>
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
            Criar Primeira Garantia
          </button>
        </div>
      )}

      {/* Modal de Formulário */}
      {showForm && (
        <GarantiaForm
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
              Tem certeza que deseja excluir a garantia do produto{' '}
              <strong>{garantiaParaExcluir.Produto?.nome_produto || garantiaParaExcluir.id_produto}</strong>{' '}
              da unidade{' '}
              <strong>{garantiaParaExcluir.Unidade?.numero_unidade || garantiaParaExcluir.id_unidade}</strong>?
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

**Arquivo:** `src/components/GarantiaForm.tsx`

```typescript
import React, { useState } from 'react';
import { garantiaService, Garantia, CriarGarantiaDTO, AtualizarGarantiaDTO } from '../services/garantiaService';

interface GarantiaFormProps {
  garantia?: Garantia | null;
  onClose: () => void;
  onSuccess: () => void;
}

const GarantiaForm: React.FC<GarantiaFormProps> = ({ garantia, onClose, onSuccess }) => {
  const [idUnidade, setIdUnidade] = useState<number>(garantia?.id_unidade || 0);
  const [idProduto, setIdProduto] = useState<number>(garantia?.id_produto || 0);
  const [dataInstalacao, setDataInstalacao] = useState<string>(
    garantia?.data_instalacao || ''
  );
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
        const dados: AtualizarGarantiaDTO = {};
        if (dataInstalacao) {
          dados.data_instalacao = dataInstalacao;
        }

        await garantiaService.atualizar(garantia!.id, dados);
        alert('✅ Garantia atualizada com sucesso!');
      } else {
        // Criar
        if (!idUnidade || !idProduto) {
          throw new Error('Unidade e Produto são obrigatórios');
        }

        const dados: CriarGarantiaDTO = {
          id_unidade: idUnidade,
          id_produto: idProduto,
          data_instalacao: dataInstalacao || null,
        };

        await garantiaService.criar(dados);
        alert('✅ Garantia criada com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao salvar garantia:', err);
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
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEditando ? 'Editar Garantia' : 'Nova Garantia'}</h2>

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
          {!isEditando && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label>
                  ID da Unidade *:
                  <input
                    type="number"
                    value={idUnidade || ''}
                    onChange={(e) => setIdUnidade(parseInt(e.target.value) || 0)}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </label>
              </div>

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
            </>
          )}

          {isEditando && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p><strong>Unidade:</strong> {garantia.Unidade?.numero_unidade || garantia.id_unidade}</p>
              <p><strong>Produto:</strong> {garantia.Produto?.nome_produto || garantia.id_produto}</p>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label>
              Data de Instalação:
              <input
                type="date"
                value={dataInstalacao}
                onChange={(e) => setDataInstalacao(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                Deixe em branco para usar a data da unidade ou entrega de chaves
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

export default GarantiaForm;
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Passo 1: Serviço
- [ ] Criar/atualizar `src/services/garantiaService.ts`
- [ ] Implementar todos os métodos (listar, buscarPorId, criar, atualizar, remover)
- [ ] Adicionar normalização de IDs

### Passo 2: Componente Principal
- [ ] Localizar a tela de Garantias no sidebar
- [ ] Atualizar o componente para usar o `garantiaService`
- [ ] Adicionar estado para lista de garantias
- [ ] Adicionar função `carregarGarantias()`
- [ ] Adicionar botão "Nova Garantia"
- [ ] Adicionar botões "Editar" e "Excluir" na tabela
- [ ] Adicionar filtros (opcional)
- [ ] Adicionar tratamento de erros

### Passo 3: Formulário
- [ ] Criar componente `GarantiaForm.tsx`
- [ ] Implementar modo criar
- [ ] Implementar modo editar
- [ ] Adicionar validações
- [ ] Adicionar tratamento de erros

### Passo 4: Modal de Confirmação
- [ ] Adicionar modal de confirmação para exclusão
- [ ] Implementar função `confirmarExclusao()`

### Passo 5: Testes
- [ ] Testar listar garantias
- [ ] Testar criar garantia
- [ ] Testar editar garantia
- [ ] Testar excluir garantia
- [ ] Testar filtros (se implementados)

---

## 🎨 MELHORIAS OPCIONAIS

### 1. Seletores de Unidade e Produto (em vez de IDs)

Se você tiver serviços de unidade e produto, pode criar seletores:

```typescript
// No formulário
const [unidades, setUnidades] = useState([]);
const [produtos, setProdutos] = useState([]);

useEffect(() => {
  // Carregar unidades e produtos para os selects
  carregarUnidades();
  carregarProdutos();
}, []);

// No JSX
<select value={idUnidade} onChange={(e) => setIdUnidade(parseInt(e.target.value))}>
  <option value="">Selecione uma unidade</option>
  {unidades.map(u => (
    <option key={u.id} value={u.id}>{u.numero_unidade}</option>
  ))}
</select>
```

### 2. Visualização Detalhada

Adicionar um botão "Ver Detalhes" que abre um modal com todas as informações da garantia.

### 3. Exportação

Adicionar botão para exportar garantias para CSV/Excel.

---

## ⚠️ PONTOS IMPORTANTES

1. **Normalização de IDs:** Sempre normalizar `id_unidade_produto_garantia` para `id` antes de usar.

2. **Validações:** 
   - `id_unidade` e `id_produto` são obrigatórios na criação
   - Não pode criar garantia duplicada (mesma unidade + produto)

3. **Erros Comuns:**
   - Se receber erro 409: "Já existe uma garantia para esta unidade e produto"
   - Se receber erro 404: Verificar se unidade/produto existem

4. **Status de Garantia:**
   - Calculado automaticamente pelo backend
   - `VALIDA` = data atual <= data fim
   - `EXPIRADA` = data atual > data fim

---

## 🔗 ENDPOINTS DA API

- `GET /api/garantias` - Listar todas
- `GET /api/garantias/:id` - Buscar por ID
- `POST /api/garantias` - Criar
- `PUT /api/garantias/:id` - Atualizar
- `DELETE /api/garantias/:id` - Excluir

---

## ✅ RESUMO

1. **Criar serviço** `garantiaService.ts` com todos os métodos CRUD
2. **Atualizar tela** de Garantias para usar o serviço
3. **Criar formulário** `GarantiaForm.tsx` para criar/editar
4. **Adicionar modais** de confirmação para exclusão
5. **Testar** todas as funcionalidades

**Tudo pronto para implementar na tela de Garantias do sidebar!** 🚀

---

**Última atualização:** Janeiro 2024
