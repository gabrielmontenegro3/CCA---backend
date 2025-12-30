# 🔐 Documentação: Permissões de Chamados por Tipo de Usuário

## 🎯 OBJETIVO DESTA DOCUMENTAÇÃO

Esta documentação explica as **regras de permissão** implementadas no sistema de chamados, baseadas no tipo de usuário. Cada tipo de usuário tem permissões diferentes para visualizar, criar e interagir com chamados.

---

## 📋 TIPOS DE USUÁRIO E SUAS PERMISSÕES

### 1. 👤 MORADOR

**Permissões:**
- ✅ **Ver:** Apenas seus próprios chamados
- ✅ **Criar:** Pode criar novos chamados
- ✅ **Participar:** Pode enviar mensagens apenas em seus próprios chamados
- ✅ **Atualizar Status:** Pode atualizar status apenas de seus próprios chamados

**Restrições:**
- ❌ Não pode ver chamados de outros usuários
- ❌ Não pode enviar mensagens em chamados de outros usuários
- ❌ Não pode atualizar status de chamados de outros usuários

**Exemplo de Uso:**
```typescript
// Morador vê apenas seus chamados
GET /api/chamados
// Retorna apenas chamados onde chamado.usuario = id_do_morador

// Morador pode ver detalhes apenas de seus chamados
GET /api/chamados/14
// Se chamado.usuario !== id_do_morador → 403 Forbidden

// Morador pode enviar mensagens apenas em seus chamados
POST /api/chamados/14/mensagens
// Se chamado.usuario !== id_do_morador → 403 Forbidden
```

---

### 2. 🛠️ GESTÃO TÉCNICA

**Permissões:**
- ✅ **Ver:** TODOS os chamados do sistema
- ✅ **Criar:** Pode criar novos chamados
- ✅ **Participar:** Pode enviar mensagens em QUALQUER chamado
- ✅ **Atualizar Status:** Pode atualizar status de QUALQUER chamado

**Restrições:**
- ❌ Nenhuma (acesso completo)

**Exemplo de Uso:**
```typescript
// Gestão Técnica vê todos os chamados
GET /api/chamados
// Retorna TODOS os chamados, independente do dono

// Gestão Técnica pode ver qualquer chamado
GET /api/chamados/14
// Sempre permite, mesmo que não seja o dono

// Gestão Técnica pode enviar mensagens em qualquer chamado
POST /api/chamados/14/mensagens
// Sempre permite, mesmo que não seja o dono
```

---

### 3. 🏗️ CONSTRUTORA

**Permissões:**
- ✅ **Ver:** TODOS os chamados do sistema (apenas leitura)
- ❌ **Criar:** NÃO pode criar chamados
- ❌ **Participar:** NÃO pode enviar mensagens
- ❌ **Atualizar Status:** NÃO pode atualizar status

**Restrições:**
- ❌ Apenas leitura - não pode interagir com chamados
- ❌ Não pode criar chamados
- ❌ Não pode enviar mensagens
- ❌ Não pode atualizar status

**Exemplo de Uso:**
```typescript
// Construtora vê todos os chamados
GET /api/chamados
// Retorna TODOS os chamados

// Construtora pode ver qualquer chamado
GET /api/chamados/14
// Sempre permite visualização

// Construtora NÃO pode enviar mensagens
POST /api/chamados/14/mensagens
// → 403 Forbidden: "Acesso negado. Usuários do tipo 'construtora' não podem enviar mensagens. Apenas leitura permitida."
```

---

### 4. 👑 ADMINISTRADOR

**Permissões:**
- ✅ **Ver:** TODOS os chamados do sistema
- ✅ **Criar:** Pode criar novos chamados
- ✅ **Participar:** Pode enviar mensagens em QUALQUER chamado
- ✅ **Atualizar Status:** Pode atualizar status de QUALQUER chamado

**Restrições:**
- ❌ Nenhuma (acesso completo, igual a Gestão Técnica)

---

## 🔌 ENDPOINTS E PERMISSÕES

### 1. LISTAR CHAMADOS

**GET** `/api/chamados`

**Headers:**
```
x-user-id: {id_do_usuario_logado}
```

**Comportamento por Tipo:**

| Tipo | Resultado |
|------|-----------|
| **Morador** | Apenas seus próprios chamados |
| **Gestão Técnica** | Todos os chamados |
| **Construtora** | Todos os chamados |
| **Administrador** | Todos os chamados |

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 14,
    "titulo": "Problema no ar condicionado",
    "descricao": "O ar condicionado não está funcionando",
    "usuario": 3,
    "status": "aberto",
    "created_at": "2025-01-01T12:00:00.000Z",
    "updated_at": "2025-01-01T12:00:00.000Z"
  }
]
```

---

### 2. DETALHAR CHAMADO

**GET** `/api/chamados/:id`

**Headers:**
```
x-user-id: {id_do_usuario_logado}
```

**Comportamento por Tipo:**

| Tipo | Permissão |
|------|-----------|
| **Morador** | Apenas seus próprios chamados (403 se não for dono) |
| **Gestão Técnica** | Qualquer chamado |
| **Construtora** | Qualquer chamado |
| **Administrador** | Qualquer chamado |

**Resposta de Sucesso (200):**
```json
{
  "id": 14,
  "titulo": "Problema no ar condicionado",
  "descricao": "O ar condicionado não está funcionando",
  "usuario": 3,
  "status": "aberto",
  "created_at": "2025-01-01T12:00:00.000Z",
  "updated_at": "2025-01-01T12:00:00.000Z",
  "mensagens": [...],
  "permissoes": {
    "pode_escrever": true,
    "tipo_usuario": "gestão tecnica"
  }
}
```

**Resposta de Erro (403) - Morador tentando ver chamado de outro:**
```json
{
  "error": "Acesso negado. Você só pode ver seus próprios chamados"
}
```

**Campo `permissoes`:**
- `pode_escrever`: `true` se pode enviar mensagens, `false` se não pode
- `tipo_usuario`: Tipo do usuário logado

---

### 3. ENVIAR MENSAGEM

**POST** `/api/chamados/:id/mensagens`

**Headers:**
```
Content-Type: multipart/form-data
x-user-id: {id_do_usuario_logado}
```

**Body (FormData):**
- `mensagem` (string, obrigatório)
- `anexos[]` (File[], opcional)

**Comportamento por Tipo:**

| Tipo | Permissão |
|------|-----------|
| **Morador** | Apenas em seus próprios chamados (403 se não for dono) |
| **Gestão Técnica** | Qualquer chamado |
| **Construtora** | ❌ NUNCA (403 sempre) |
| **Administrador** | Qualquer chamado |

**Resposta de Sucesso (201):**
```json
{
  "id": 28,
  "autor_tipo": "tecnico",
  "autor_id": 2,
  "mensagem": "Vou verificar o problema",
  "created_at": "2025-01-01T15:00:00.000Z",
  "anexos": []
}
```

**Resposta de Erro (403) - Construtora tentando enviar:**
```json
{
  "error": "Acesso negado. Usuários do tipo 'construtora' não podem enviar mensagens. Apenas leitura permitida."
}
```

**Resposta de Erro (403) - Morador tentando enviar em chamado de outro:**
```json
{
  "error": "Acesso negado. Você só pode enviar mensagens em seus próprios chamados"
}
```

---

### 4. ATUALIZAR STATUS DO CHAMADO

**PATCH** `/api/chamados/:id/status`

**Headers:**
```
Content-Type: application/json
x-user-id: {id_do_usuario_logado}
```

**Body:**
```json
{
  "status": "em_andamento"
}
```

**Status Válidos:**
- `"aberto"`
- `"em_andamento"`
- `"resolvido"`
- `"cancelado"`

**Comportamento por Tipo:**

| Tipo | Permissão |
|------|-----------|
| **Morador** | Apenas seus próprios chamados (403 se não for dono) |
| **Gestão Técnica** | Qualquer chamado |
| **Construtora** | ❌ NUNCA (403 sempre) |
| **Administrador** | Qualquer chamado |

**Resposta de Sucesso (200):**
```json
{
  "id": 14,
  "titulo": "Problema no ar condicionado",
  "descricao": "O ar condicionado não está funcionando",
  "usuario": 3,
  "status": "em_andamento",
  "created_at": "2025-01-01T12:00:00.000Z",
  "updated_at": "2025-01-01T16:00:00.000Z"
}
```

**Resposta de Erro (400):**
```json
{
  "error": "status é obrigatório"
}
```

ou

```json
{
  "error": "status deve ser um dos seguintes: aberto, em_andamento, resolvido, cancelado"
}
```

**Resposta de Erro (403) - Construtora:**
```json
{
  "error": "Acesso negado. Você não tem permissão para atualizar status"
}
```

**Resposta de Erro (403) - Morador em chamado de outro:**
```json
{
  "error": "Acesso negado. Você só pode atualizar seus próprios chamados"
}
```

---

## 💻 IMPLEMENTAÇÃO NO FRONTEND

### 1. Verificar Permissões ao Carregar Chamado

```typescript
// services/chamadoService.ts

export const chamadoService = {
  buscarPorId: async (id: number): Promise<Chamado> => {
    const response = await fetch(`${API_BASE_URL}/chamados/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar chamado');
    }

    const chamado = await response.json();
    
    // O backend retorna informações de permissão
    // chamado.permissoes.pode_escrever indica se pode enviar mensagens
    // chamado.permissoes.tipo_usuario indica o tipo do usuário
    
    return chamado;
  }
};
```

### 2. Componente de Chat com Verificação de Permissões

```typescript
// components/ChatChamado.tsx

import React, { useEffect, useState } from 'react';
import { chamadoService, Chamado } from '../services/chamadoService';

export const ChatChamado: React.FC<{ chamadoId: number }> = ({ chamadoId }) => {
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [podeEscrever, setPodeEscrever] = useState(false);

  useEffect(() => {
    const carregarChamado = async () => {
      try {
        const dados = await chamadoService.buscarPorId(chamadoId);
        setChamado(dados);
        
        // Verificar permissões retornadas pelo backend
        if (dados.permissoes) {
          setPodeEscrever(dados.permissoes.pode_escrever);
        }
      } catch (error: any) {
        if (error.message.includes('Acesso negado')) {
          alert('Você não tem permissão para ver este chamado');
        } else {
          alert(`Erro: ${error.message}`);
        }
      }
    };

    carregarChamado();
  }, [chamadoId]);

  const handleEnviarMensagem = async () => {
    if (!podeEscrever) {
      alert('Você não tem permissão para enviar mensagens neste chamado');
      return;
    }

    // ... lógica de envio
  };

  return (
    <div className="chat-chamado">
      {/* ... exibir mensagens ... */}
      
      {/* Mostrar campo de input apenas se pode escrever */}
      {podeEscrever ? (
        <div className="chat-input">
          {/* Campo de mensagem */}
        </div>
      ) : (
        <div className="chat-readonly">
          <p>Você tem apenas permissão de leitura neste chamado</p>
        </div>
      )}
    </div>
  );
};
```

### 3. Componente de Atualização de Status

```typescript
// components/AtualizarStatusChamado.tsx

import React, { useState } from 'react';
import { chamadoService } from '../services/chamadoService';

interface AtualizarStatusProps {
  chamadoId: number;
  statusAtual: string;
  onStatusAtualizado?: () => void;
}

export const AtualizarStatusChamado: React.FC<AtualizarStatusProps> = ({
  chamadoId,
  statusAtual,
  onStatusAtualizado
}) => {
  const [status, setStatus] = useState(statusAtual);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleAtualizar = async () => {
    try {
      setAtualizando(true);
      setErro(null);

      await chamadoService.atualizarStatus(chamadoId, status);
      
      if (onStatusAtualizado) {
        onStatusAtualizado();
      }
      
      alert('Status atualizado com sucesso!');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        setErro('Você não tem permissão para atualizar o status deste chamado');
      } else {
        setErro(error.message || 'Erro ao atualizar status');
      }
    } finally {
      setAtualizando(false);
    }
  };

  return (
    <div className="atualizar-status">
      <label>
        Status:
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={atualizando}
        >
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="resolvido">Resolvido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </label>

      <button
        onClick={handleAtualizar}
        disabled={atualizando || status === statusAtual}
      >
        {atualizando ? 'Atualizando...' : 'Atualizar Status'}
      </button>

      {erro && <div className="erro">{erro}</div>}
    </div>
  );
};
```

### 4. Service com Método de Atualização de Status

```typescript
// services/chamadoService.ts

export const chamadoService = {
  // ... outros métodos ...

  atualizarStatus: async (chamadoId: number, status: string): Promise<Chamado> => {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuário não identificado');
    }

    const response = await fetch(`${API_BASE_URL}/chamados/${chamadoId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId.toString()
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar status');
    }

    return response.json();
  }
};
```

---

## 📊 RESUMO DAS PERMISSÕES

| Ação | Morador | Gestão Técnica | Construtora | Administrador |
|------|---------|----------------|-------------|---------------|
| **Ver seus chamados** | ✅ | ✅ | ✅ | ✅ |
| **Ver chamados de outros** | ❌ | ✅ | ✅ | ✅ |
| **Criar chamados** | ✅ | ✅ | ❌ | ✅ |
| **Enviar mensagens (seus chamados)** | ✅ | ✅ | ❌ | ✅ |
| **Enviar mensagens (outros chamados)** | ❌ | ✅ | ❌ | ✅ |
| **Atualizar status (seus chamados)** | ✅ | ✅ | ❌ | ✅ |
| **Atualizar status (outros chamados)** | ❌ | ✅ | ❌ | ✅ |

---

## ⚠️ TRATAMENTO DE ERROS

### Erro 403 (Forbidden)

Sempre que houver erro 403, significa que o usuário não tem permissão para realizar a ação. Trate adequadamente:

```typescript
try {
  await chamadoService.enviarMensagem(chamadoId, { mensagem });
} catch (error: any) {
  if (error.message.includes('Acesso negado')) {
    // Mostrar mensagem amigável
    alert('Você não tem permissão para realizar esta ação');
  } else {
    // Outro tipo de erro
    alert(`Erro: ${error.message}`);
  }
}
```

### Verificar Permissões Antes de Mostrar Ações

```typescript
// Verificar se pode escrever antes de mostrar botão
{chamado?.permissoes?.pode_escrever && (
  <button onClick={handleEnviarMensagem}>
    Enviar Mensagem
  </button>
)}

// Verificar tipo de usuário
{chamado?.permissoes?.tipo_usuario !== 'construtora' && (
  <AtualizarStatusChamado chamadoId={chamadoId} />
)}
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Verificar permissões retornadas em `GET /chamados/:id` (campo `permissoes`)
- [ ] Ocultar botão de enviar mensagem se `pode_escrever === false`
- [ ] Ocultar seletor de status se usuário for "construtora"
- [ ] Tratar erro 403 ao tentar enviar mensagem
- [ ] Tratar erro 403 ao tentar atualizar status
- [ ] Mostrar mensagem amigável quando acesso for negado
- [ ] Validar permissões antes de mostrar ações no UI
- [ ] Testar com diferentes tipos de usuário

---

**Última atualização:** 30/12/2025
**Versão da API:** 1.0.0

