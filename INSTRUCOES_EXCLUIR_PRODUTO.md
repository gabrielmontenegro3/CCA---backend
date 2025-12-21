# 🗑️ Instruções para Implementar Exclusão de Produtos

## 🎯 Objetivo

Implementar a funcionalidade de excluir produtos no front-end, garantindo que funcione corretamente com o campo `id_produto` do banco de dados.

## 🔌 Endpoint de Exclusão

**DELETE** `/api/produtos/:id`

### Exemplo:
```
DELETE http://localhost:3000/api/produtos/7
```

**Resposta de sucesso (200):**
```json
{
  "message": "Produto removido com sucesso"
}
```

**Resposta de erro (404):**
```json
{
  "error": "Produto não encontrado"
}
```

---

## ✅ IMPLEMENTAÇÃO NO FRONT-END

### 1. Atualizar o Serviço de Produtos

**Garantir que o método `remover` está correto:**

```typescript
// src/services/produtoService.ts

export const produtoService = {
  // ... outros métodos ...

  remover: async (id: number): Promise<void> => {
    // ✅ VERIFICAR se o ID foi passado
    if (!id || id === 0) {
      throw new Error('ID do produto é obrigatório para exclusão');
    }

    console.log('🗑️ Deletando produto ID:', id);

    const response = await fetch(`${API_BASE_URL}/produtos/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erro ao deletar:', error);
      throw new Error(error.error || 'Erro ao remover produto');
    }

    console.log('✅ Produto deletado com sucesso');
  },
};
```

### 2. Implementar Função de Exclusão no Componente

**No componente de listagem de produtos:**

```typescript
// src/components/Produtos.tsx ou similar

import { produtoService, Produto } from '../services/produtoService';

const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ... código de carregar produtos ...

  const handleExcluir = (produto: any) => {
    // ✅ NORMALIZAR ID - mapear id_produto para id
    const idProduto = produto.id || produto.id_produto;
    
    if (!idProduto) {
      console.error('❌ Produto não tem ID válido:', produto);
      alert('Erro: Produto não possui ID válido');
      return;
    }

    // ✅ Criar produto normalizado para exibir no modal
    const produtoNormalizado = {
      ...produto,
      id: idProduto,
    };

    setProdutoParaExcluir(produtoNormalizado);
    setShowConfirmModal(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir) return;

    const id = produtoParaExcluir.id;
    
    if (!id) {
      alert('Erro: ID do produto não encontrado');
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Confirmando exclusão do produto ID:', id);
      
      await produtoService.remover(id);
      
      // ✅ Recarregar lista após exclusão
      await carregarProdutos();
      
      // ✅ Fechar modal e limpar estado
      setShowConfirmModal(false);
      setProdutoParaExcluir(null);
      
      // ✅ Mostrar mensagem de sucesso
      alert('Produto excluído com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao excluir produto:', err);
      alert('Erro ao excluir produto: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const cancelarExclusao = () => {
    setShowConfirmModal(false);
    setProdutoParaExcluir(null);
  };

  return (
    <div>
      {/* Lista de produtos */}
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            // ✅ Normalizar ID para exibição
            const idProduto = produto.id || (produto as any).id_produto;
            
            return (
              <tr key={idProduto}>
                <td>{produto.codigo_sku}</td>
                <td>{produto.nome_produto}</td>
                <td>{produto.categoria}</td>
                <td>
                  <button onClick={() => handleEditar(produto)}>Editar</button>
                  <button 
                    onClick={() => handleExcluir(produto)}
                    style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal de Confirmação */}
      {showConfirmModal && produtoParaExcluir && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja excluir o produto <strong>{produtoParaExcluir.nome_produto}</strong>?
            </p>
            <p style={{ color: '#dc3545', fontSize: '14px' }}>
              ⚠️ Esta ação não pode ser desfeita!
            </p>
            <div className="modal-actions">
              <button 
                onClick={confirmarExclusao}
                disabled={loading}
                style={{ backgroundColor: '#dc3545', color: 'white' }}
              >
                {loading ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
              <button 
                onClick={cancelarExclusao}
                disabled={loading}
                style={{ marginLeft: '10px' }}
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
```

---

## 🎨 Componente de Modal de Confirmação (Opcional - Separado)

**Se preferir criar um componente separado:**

```typescript
// src/components/ConfirmDeleteModal.tsx

import React from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  produto: { nome_produto: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  produto,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen || !produto) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={onCancel}
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
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        <h2>Confirmar Exclusão</h2>
        <p>
          Tem certeza que deseja excluir o produto <strong>{produto.nome_produto}</strong>?
        </p>
        <p style={{ color: '#dc3545', fontSize: '14px' }}>
          ⚠️ Esta ação não pode ser desfeita!
        </p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={onConfirm}
            disabled={loading}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
          <button 
            onClick={onCancel}
            disabled={loading}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
```

**Usar no componente principal:**

```typescript
import ConfirmDeleteModal from './ConfirmDeleteModal';

// No componente:
<ConfirmDeleteModal
  isOpen={showConfirmModal}
  produto={produtoParaExcluir}
  onConfirm={confirmarExclusao}
  onCancel={cancelarExclusao}
  loading={loading}
/>
```

---

## 🔍 Tratamento de Erros

### Erros Comuns e Como Tratar:

```typescript
const confirmarExclusao = async () => {
  if (!produtoParaExcluir) return;

  const id = produtoParaExcluir.id;
  
  if (!id) {
    alert('Erro: ID do produto não encontrado');
    return;
  }

  try {
    setLoading(true);
    await produtoService.remover(id);
    
    // ✅ Sucesso
    await carregarProdutos();
    setShowConfirmModal(false);
    setProdutoParaExcluir(null);
    
    // Opção 1: Alert simples
    alert('Produto excluído com sucesso!');
    
    // Opção 2: Toast/Notificação (se tiver biblioteca)
    // toast.success('Produto excluído com sucesso!');
    
  } catch (err: any) {
    console.error('Erro ao excluir:', err);
    
    // ✅ Tratar diferentes tipos de erro
    if (err.message.includes('não encontrado')) {
      alert('Produto não encontrado. Pode ter sido excluído por outro usuário.');
    } else if (err.message.includes('permissão') || err.message.includes('permission')) {
      alert('Você não tem permissão para excluir este produto.');
    } else {
      alert('Erro ao excluir produto: ' + err.message);
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 📋 Checklist de Implementação

### Funcionalidades Básicas:
- [ ] Botão "Excluir" na lista de produtos
- [ ] Modal de confirmação antes de excluir
- [ ] Exibir nome do produto no modal de confirmação
- [ ] Chamar `produtoService.remover(id)` ao confirmar
- [ ] Recarregar lista após exclusão bem-sucedida
- [ ] Tratamento de erros com mensagens claras
- [ ] Loading state durante exclusão

### Melhorias Opcionais:
- [ ] Toast/notificação de sucesso
- [ ] Desabilitar botão durante exclusão
- [ ] Animações de transição
- [ ] Undo/Desfazer (opcional, mais complexo)

---

## 🎯 CÓDIGO COMPLETO DE EXEMPLO

### Componente Completo com Exclusão:

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, Produto } from '../services/produtoService';

const ProdutosPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [excluindo, setExcluindo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setError(null);
      const dados = await produtoService.listar();
      
      // ✅ Normalizar IDs
      const produtosNormalizados = dados.map((produto: any) => ({
        ...produto,
        id: produto.id || produto.id_produto,
      }));
      
      setProdutos(produtosNormalizados);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = (produto: any) => {
    // ✅ Normalizar ID
    const idProduto = produto.id || produto.id_produto;
    
    if (!idProduto) {
      alert('Erro: Produto não possui ID válido');
      return;
    }

    const produtoNormalizado = {
      ...produto,
      id: idProduto,
    };

    setProdutoParaExcluir(produtoNormalizado);
    setShowConfirmModal(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir || !produtoParaExcluir.id) {
      alert('Erro: ID do produto não encontrado');
      return;
    }

    try {
      setExcluindo(true);
      console.log('🗑️ Excluindo produto ID:', produtoParaExcluir.id);
      
      await produtoService.remover(produtoParaExcluir.id);
      
      // ✅ Recarregar lista
      await carregarProdutos();
      
      // ✅ Fechar modal
      setShowConfirmModal(false);
      setProdutoParaExcluir(null);
      
      // ✅ Feedback de sucesso
      alert('✅ Produto excluído com sucesso!');
    } catch (err: any) {
      console.error('❌ Erro ao excluir:', err);
      alert('Erro ao excluir produto: ' + err.message);
    } finally {
      setExcluindo(false);
    }
  };

  const cancelarExclusao = () => {
    setShowConfirmModal(false);
    setProdutoParaExcluir(null);
  };

  if (loading) return <div>Carregando produtos...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Produtos</h1>
      
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nome</th>
            <th>Categoria</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {produtos.map((produto) => {
            const idProduto = produto.id || (produto as any).id_produto;
            return (
              <tr key={idProduto}>
                <td>{produto.codigo_sku}</td>
                <td>{produto.nome_produto}</td>
                <td>{produto.categoria}</td>
                <td>
                  <button onClick={() => handleEditar(produto)}>Editar</button>
                  <button 
                    onClick={() => handleExcluir(produto)}
                    style={{ 
                      marginLeft: '10px', 
                      backgroundColor: '#dc3545', 
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Modal de Confirmação */}
      {showConfirmModal && produtoParaExcluir && (
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
          onClick={cancelarExclusao}
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
              Tem certeza que deseja excluir o produto <strong>{produtoParaExcluir.nome_produto}</strong>?
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
                onClick={cancelarExclusao}
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

export default ProdutosPage;
```

---

## 🐛 Debugging

### Se a exclusão não funcionar:

1. **Verificar no Console:**
   ```typescript
   console.log('ID do produto:', produto.id || produto.id_produto);
   console.log('Vou deletar:', id);
   ```

2. **Verificar no Network Tab:**
   - Abra F12 → Network
   - Clique em "Excluir"
   - Procure pela requisição `DELETE /api/produtos/{id}`
   - Verifique:
     - ✅ URL deve ter o ID: `/api/produtos/7`
     - ✅ Method deve ser: `DELETE`
     - ✅ Status deve ser: `200` (sucesso) ou `404` (não encontrado)

3. **Verificar a Resposta:**
   - Se status 200: Sucesso
   - Se status 404: Produto não encontrado
   - Se status 500: Erro no servidor

---

## ⚡ RESUMO

### O que fazer:
1. ✅ Normalizar `id_produto` → `id` antes de excluir
2. ✅ Mostrar modal de confirmação
3. ✅ Chamar `produtoService.remover(id)` com o ID normalizado
4. ✅ Recarregar lista após exclusão
5. ✅ Tratar erros adequadamente

### Código chave:
```typescript
// ✅ Normalizar ID
const id = produto.id || produto.id_produto;

// ✅ Excluir
await produtoService.remover(id);

// ✅ Recarregar
await carregarProdutos();
```

---

**Última atualização:** Janeiro 2024



