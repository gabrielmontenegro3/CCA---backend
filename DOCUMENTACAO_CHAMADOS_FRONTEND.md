# 📋 Documentação: Integração de Chamados - Tela Assistência Técnica

## 🎯 Objetivo

Esta documentação explica como integrar a funcionalidade de **Chamados** na tela **Assistência Técnica** do frontend. O sistema permite criar, visualizar, atualizar e gerenciar chamados técnicos associados a usuários.

---

## 📊 Estrutura da Tabela

A tabela `chamado` no Supabase possui a seguinte estrutura:

```sql
CREATE TABLE chamado (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    usuario INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    descricao TEXT,
    CONSTRAINT fk_chamado_usuario
        FOREIGN KEY (usuario)
        REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### Campos:
- **id**: ID único do chamado (gerado automaticamente)
- **titulo**: Título do chamado (obrigatório)
- **usuario**: ID do usuário que criou o chamado (obrigatório, FK para `usuarios`)
- **status**: Status do chamado (obrigatório)
- **descricao**: Descrição detalhada do chamado (opcional)

### Status Válidos:
- `aberto` - Chamado recém-criado
- `em_andamento` - Chamado sendo atendido
- `resolvido` - Chamado finalizado com sucesso
- `cancelado` - Chamado cancelado

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api/chamados
```

---

## 📝 Endpoints Disponíveis

### 1. Listar Todos os Chamados

**GET** `/api/chamados`

**Query Parameters (opcionais):**
- `status` - Filtrar por status (ex: `?status=aberto`)
- `usuario` - Filtrar por usuário (ex: `?usuario=1`)

**Exemplo de Requisição:**
```javascript
// Listar todos os chamados
GET /api/chamados

// Filtrar por status
GET /api/chamados?status=aberto

// Filtrar por usuário
GET /api/chamados?usuario=1

// Combinar filtros
GET /api/chamados?status=em_andamento&usuario=1
```

**Resposta (200):**
```json
[
  {
    "id": 1,
    "titulo": "Problema no ar condicionado",
    "usuario": 1,
    "status": "aberto",
    "descricao": "O ar condicionado da sala não está funcionando",
    "usuario_dados": {
      "id": 1,
      "nome": "João Silva",
      "tipo": "morador"
    }
  },
  {
    "id": 2,
    "titulo": "Vazamento na cozinha",
    "usuario": 2,
    "status": "em_andamento",
    "descricao": "Há um vazamento na torneira da cozinha",
    "usuario_dados": {
      "id": 2,
      "nome": "Maria Santos",
      "tipo": "morador"
    }
  }
]
```

**Exemplo de Código Frontend:**
```javascript
// Função para buscar chamados
const buscarChamados = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.status) params.append('status', filtros.status);
    if (filtros.usuario) params.append('usuario', filtros.usuario);
    
    const url = `/api/chamados${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    throw error;
  }
};

// Uso
const chamados = await buscarChamados({ status: 'aberto' });
```

---

### 2. Buscar Chamado por ID

**GET** `/api/chamados/:id`

**Exemplo de Requisição:**
```javascript
GET /api/chamados/1
```

**Resposta (200):**
```json
{
  "id": 1,
  "titulo": "Problema no ar condicionado",
  "usuario": 1,
  "status": "aberto",
  "descricao": "O ar condicionado da sala não está funcionando",
  "usuario_dados": {
    "id": 1,
    "nome": "João Silva",
    "tipo": "morador"
  }
}
```

**Resposta (404):**
```json
{
  "error": "Chamado não encontrado"
}
```

**Exemplo de Código Frontend:**
```javascript
const buscarChamadoPorId = async (id) => {
  try {
    const response = await fetch(`/api/chamados/${id}`);
    if (!response.ok) {
      throw new Error('Chamado não encontrado');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar chamado:', error);
    throw error;
  }
};
```

---

### 3. Criar Novo Chamado

**POST** `/api/chamados`

**Body (JSON):**
```json
{
  "titulo": "Problema no ar condicionado",
  "usuario": 1,
  "status": "aberto",
  "descricao": "O ar condicionado da sala não está funcionando"
}
```

**Campos Obrigatórios:**
- `titulo` (string) - Título do chamado
- `usuario` (number) - ID do usuário
- `status` (string) - Status do chamado (deve ser: `aberto`, `em_andamento`, `resolvido`, ou `cancelado`)

**Campos Opcionais:**
- `descricao` (string) - Descrição detalhada

**Resposta (201):**
```json
{
  "id": 1,
  "titulo": "Problema no ar condicionado",
  "usuario": 1,
  "status": "aberto",
  "descricao": "O ar condicionado da sala não está funcionando",
  "usuario_dados": {
    "id": 1,
    "nome": "João Silva",
    "tipo": "morador"
  }
}
```

**Resposta (400) - Erro de Validação:**
```json
{
  "error": "titulo, usuario e status são obrigatórios"
}
```

**Resposta (400) - Status Inválido:**
```json
{
  "error": "status deve ser um dos seguintes: aberto, em_andamento, resolvido, cancelado"
}
```

**Resposta (400) - Usuário Não Encontrado:**
```json
{
  "error": "Usuário não encontrado"
}
```

**Exemplo de Código Frontend:**
```javascript
const criarChamado = async (dadosChamado) => {
  try {
    const response = await fetch('/api/chamados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titulo: dadosChamado.titulo,
        usuario: dadosChamado.usuario,
        status: 'aberto', // Status padrão ao criar
        descricao: dadosChamado.descricao || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar chamado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar chamado:', error);
    throw error;
  }
};

// Uso
const novoChamado = await criarChamado({
  titulo: 'Problema no ar condicionado',
  usuario: 1,
  descricao: 'O ar condicionado da sala não está funcionando'
});
```

---

### 4. Atualizar Chamado

**PUT** `/api/chamados/:id`

**Body (JSON) - Todos os campos são opcionais:**
```json
{
  "titulo": "Problema no ar condicionado - Atualizado",
  "status": "em_andamento",
  "descricao": "Técnico foi chamado para verificar"
}
```

**Resposta (200):**
```json
{
  "id": 1,
  "titulo": "Problema no ar condicionado - Atualizado",
  "usuario": 1,
  "status": "em_andamento",
  "descricao": "Técnico foi chamado para verificar",
  "usuario_dados": {
    "id": 1,
    "nome": "João Silva",
    "tipo": "morador"
  }
}
```

**Resposta (404):**
```json
{
  "error": "Chamado não encontrado"
}
```

**Exemplo de Código Frontend:**
```javascript
const atualizarChamado = async (id, dadosAtualizados) => {
  try {
    const response = await fetch(`/api/chamados/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosAtualizados)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar chamado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    throw error;
  }
};

// Uso
await atualizarChamado(1, {
  status: 'em_andamento',
  descricao: 'Técnico foi chamado para verificar'
});
```

---

### 5. Deletar Chamado

**DELETE** `/api/chamados/:id`

**Exemplo de Requisição:**
```javascript
DELETE /api/chamados/1
```

**Resposta (200):**
```json
{
  "message": "Chamado removido com sucesso"
}
```

**Resposta (404):**
```json
{
  "error": "Chamado não encontrado"
}
```

**Exemplo de Código Frontend:**
```javascript
const deletarChamado = async (id) => {
  try {
    const response = await fetch(`/api/chamados/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar chamado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao deletar chamado:', error);
    throw error;
  }
};
```

---

### 6. Atualizar Status do Chamado (Endpoint Específico)

**PATCH** `/api/chamados/:id/status`

**Body (JSON):**
```json
{
  "status": "resolvido"
}
```

**Resposta (200):**
```json
{
  "id": 1,
  "titulo": "Problema no ar condicionado",
  "usuario": 1,
  "status": "resolvido",
  "descricao": "Problema resolvido",
  "usuario_dados": {
    "id": 1,
    "nome": "João Silva",
    "tipo": "morador"
  }
}
```

**Exemplo de Código Frontend:**
```javascript
const atualizarStatusChamado = async (id, novoStatus) => {
  try {
    const response = await fetch(`/api/chamados/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: novoStatus })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar status');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

// Uso
await atualizarStatusChamado(1, 'resolvido');
```

---

## 🎨 Implementação na Tela Assistência Técnica

### Estrutura Recomendada da Tela

A tela de **Assistência Técnica** deve conter:

1. **Lista de Chamados** (tabela ou cards)
   - Mostrar: ID, Título, Usuário, Status, Data de Criação
   - Filtros: Por status, por usuário
   - Ordenação: Por data (mais recentes primeiro)

2. **Formulário de Criação/Edição**
   - Campo: Título (obrigatório)
   - Campo: Descrição (opcional, textarea)
   - Campo: Usuário (select/dropdown com lista de usuários)
   - Campo: Status (select com opções válidas)

3. **Visualização Detalhada**
   - Mostrar todos os dados do chamado
   - Permitir edição inline do status
   - Histórico de alterações (se implementado)

### Exemplo de Componente React

```jsx
import React, { useState, useEffect } from 'react';

const AssistenciaTecnica = () => {
  const [chamados, setChamados] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    usuario: '',
    status: 'aberto'
  });

  // Buscar chamados
  useEffect(() => {
    buscarChamados();
  }, [filtroStatus]);

  const buscarChamados = async () => {
    setLoading(true);
    try {
      const params = filtroStatus ? `?status=${filtroStatus}` : '';
      const response = await fetch(`/api/chamados${params}`);
      const data = await response.json();
      setChamados(data);
    } catch (error) {
      console.error('Erro ao buscar chamados:', error);
      alert('Erro ao carregar chamados');
    } finally {
      setLoading(false);
    }
  };

  // Criar chamado
  const handleCriarChamado = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const novoChamado = await response.json();
      setChamados([novoChamado, ...chamados]);
      setFormData({ titulo: '', descricao: '', usuario: '', status: 'aberto' });
      alert('Chamado criado com sucesso!');
    } catch (error) {
      alert(error.message);
    }
  };

  // Atualizar status
  const handleAtualizarStatus = async (id, novoStatus) => {
    try {
      const response = await fetch(`/api/chamados/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      const chamadoAtualizado = await response.json();
      setChamados(chamados.map(c => c.id === id ? chamadoAtualizado : c));
    } catch (error) {
      alert('Erro ao atualizar status');
    }
  };

  // Deletar chamado
  const handleDeletarChamado = async (id) => {
    if (!confirm('Tem certeza que deseja deletar este chamado?')) return;

    try {
      const response = await fetch(`/api/chamados/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar chamado');
      }

      setChamados(chamados.filter(c => c.id !== id));
      alert('Chamado deletado com sucesso!');
    } catch (error) {
      alert('Erro ao deletar chamado');
    }
  };

  return (
    <div className="assistencia-tecnica">
      <h1>Assistência Técnica</h1>

      {/* Filtros */}
      <div className="filtros">
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_andamento">Em Andamento</option>
          <option value="resolvido">Resolvido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {/* Formulário de Criação */}
      <form onSubmit={handleCriarChamado} className="form-criar-chamado">
        <h2>Criar Novo Chamado</h2>
        <input
          type="text"
          placeholder="Título do chamado"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          required
        />
        <textarea
          placeholder="Descrição (opcional)"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
        />
        <input
          type="number"
          placeholder="ID do Usuário"
          value={formData.usuario}
          onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
          required
        />
        <button type="submit">Criar Chamado</button>
      </form>

      {/* Lista de Chamados */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <table className="tabela-chamados">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Usuário</th>
              <th>Status</th>
              <th>Descrição</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {chamados.map(chamado => (
              <tr key={chamado.id}>
                <td>{chamado.id}</td>
                <td>{chamado.titulo}</td>
                <td>{chamado.usuario_dados?.nome || 'N/A'}</td>
                <td>
                  <select
                    value={chamado.status}
                    onChange={(e) => handleAtualizarStatus(chamado.id, e.target.value)}
                  >
                    <option value="aberto">Aberto</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="resolvido">Resolvido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td>{chamado.descricao || '-'}</td>
                <td>
                  <button onClick={() => handleDeletarChamado(chamado.id)}>
                    Deletar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssistenciaTecnica;
```

---

## 🎨 Sugestões de UI/UX

### Cores por Status
- **Aberto**: Vermelho/Laranja (indica urgência)
- **Em Andamento**: Amarelo/Azul (indica trabalho em progresso)
- **Resolvido**: Verde (indica conclusão)
- **Cancelado**: Cinza (indica desistência)

### Badges/Etiquetas
Use badges coloridos para mostrar o status de forma visual:
```jsx
const StatusBadge = ({ status }) => {
  const cores = {
    aberto: 'bg-red-500',
    em_andamento: 'bg-yellow-500',
    resolvido: 'bg-green-500',
    cancelado: 'bg-gray-500'
  };

  return (
    <span className={`badge ${cores[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};
```

### Cards em vez de Tabela
Para uma interface mais moderna, use cards:
```jsx
{chamados.map(chamado => (
  <div key={chamado.id} className="card-chamado">
    <h3>{chamado.titulo}</h3>
    <p>Usuário: {chamado.usuario_dados?.nome}</p>
    <StatusBadge status={chamado.status} />
    <p>{chamado.descricao}</p>
    <button onClick={() => handleAtualizarStatus(chamado.id, 'resolvido')}>
      Marcar como Resolvido
    </button>
  </div>
))}
```

---

## ⚠️ Tratamento de Erros

Sempre trate os erros retornados pela API:

```javascript
try {
  const response = await fetch('/api/chamados');
  if (!response.ok) {
    const error = await response.json();
    // Mostrar mensagem de erro para o usuário
    alert(error.error);
    return;
  }
  const data = await response.json();
  // Processar dados
} catch (error) {
  console.error('Erro na requisição:', error);
  alert('Erro ao conectar com o servidor');
}
```

---

## 📊 Integração com Lista de Usuários

Para popular o select de usuários no formulário, use o endpoint de usuários:

```javascript
// Buscar lista de usuários
const buscarUsuarios = async () => {
  try {
    const response = await fetch('/api/usuarios');
    const usuarios = await response.json();
    return usuarios;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
};

// No componente
const [usuarios, setUsuarios] = useState([]);

useEffect(() => {
  buscarUsuarios().then(setUsuarios);
}, []);

// No select
<select
  value={formData.usuario}
  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
>
  <option value="">Selecione um usuário</option>
  {usuarios.map(usuario => (
    <option key={usuario.id} value={usuario.id}>
      {usuario.nome} ({usuario.tipo})
    </option>
  ))}
</select>
```

---

## ✅ Checklist de Implementação

- [ ] Criar componente de lista de chamados
- [ ] Implementar filtros por status e usuário
- [ ] Criar formulário de criação de chamado
- [ ] Implementar edição de chamado
- [ ] Adicionar funcionalidade de deletar chamado
- [ ] Implementar atualização de status
- [ ] Adicionar tratamento de erros
- [ ] Integrar com lista de usuários
- [ ] Adicionar loading states
- [ ] Implementar feedback visual (toasts/notifications)
- [ ] Adicionar validação de formulários
- [ ] Testar todos os endpoints

---

## 🔗 Endpoints Relacionados

- **Usuários**: `/api/usuarios` - Para buscar lista de usuários para o formulário
- **Login**: `/api/usuarios/login` - Para autenticação (se necessário)

---

## 📝 Notas Importantes

1. **Validação de Status**: Sempre valide o status antes de enviar. Os valores válidos são: `aberto`, `em_andamento`, `resolvido`, `cancelado`.

2. **Usuário Obrigatório**: O campo `usuario` deve ser um ID válido de um usuário existente na tabela `usuarios`.

3. **Resposta com Dados do Usuário**: Todos os endpoints que retornam chamados também retornam `usuario_dados` com informações do usuário (nome, tipo).

4. **Filtros**: Use query parameters para filtrar a lista de chamados sem precisar buscar todos e filtrar no frontend.

5. **Ordenação**: Os chamados são retornados ordenados por ID decrescente (mais recentes primeiro).

---

## 🚀 Próximos Passos (Opcional)

- Adicionar campo de data de criação/modificação
- Implementar histórico de alterações
- Adicionar anexos/fotos aos chamados
- Criar sistema de notificações
- Adicionar comentários/respostas aos chamados
- Implementar busca por texto (título/descrição)

---

**Documentação criada em:** 2024
**Versão da API:** 1.0.0
