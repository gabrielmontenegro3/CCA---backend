# Documentação de Integração - Sistema de Usuários

## Visão Geral

Este documento explica como integrar o sistema de usuários no frontend. O backend fornece endpoints CRUD completos para gerenciamento de usuários, incluindo autenticação e controle de permissões baseado em tipos de usuário.

## ⚠️ IMPORTANTE: URL Base

**TODAS as URLs devem começar com `/api/usuarios`**

A URL base completa é:
```
http://localhost:3000/api/usuarios
```

**❌ ERRADO:**
- `http://localhost:3000/usuarios/login`
- `/usuarios/login`
- `localhost:3000/api/usuarios/login` (falta `http://`)

**✅ CORRETO:**
- `http://localhost:3000/api/usuarios/login`
- `/api/usuarios/login` (se usar baseURL configurada)

## 🔧 Troubleshooting - Erros Comuns

### Erro: "Unsupported protocol localhost:"

Este erro ocorre quando a URL está sem o protocolo `http://` ou `https://`.

**❌ ERRADO:**
```javascript
// Falta o protocolo http://
const response = await fetch('localhost:3000/api/usuarios/login', {
  method: 'POST',
  // ...
});
```

**✅ CORRETO:**
```javascript
// Com protocolo http://
const response = await fetch('http://localhost:3000/api/usuarios/login', {
  method: 'POST',
  // ...
});
```

**Solução Recomendada com Axios:**

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // ✅ Sempre com http://
  headers: {
    'Content-Type': 'application/json',
  },
});

// Então usar:
api.post('/usuarios/login', { nome, senha }); // ✅ Funciona
```

## Estrutura da Tabela

A tabela `usuarios` possui a seguinte estrutura:

```sql
TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,  -- Armazenada com hash bcrypt
    tipo VARCHAR(50) NOT NULL
);
```

## Tipos de Usuários e Permissões

### 1. **construtora**
- **Permissões**: Apenas leitura
- **Ações permitidas**: Visualizar dados, fazer downloads de documentos
- **Ações bloqueadas**: Criar, editar, deletar qualquer registro

### 2. **gestão tecnica**
- **Permissões**: CRUD completo
- **Ações permitidas**: Criar, ler, editar, deletar todos os registros do sistema
- **Ações bloqueadas**: Gerenciar usuários (criar/editar/deletar)

### 3. **morador**
- **Permissões**: Leitura + criação de chamados
- **Ações permitidas**: 
  - Visualizar dados (apenas leitura)
  - Fazer downloads de documentos
  - **Criar chamados na tela "Assistência Técnica"** (única função de edição disponível)
- **Ações bloqueadas**: Editar ou deletar qualquer registro (exceto criar chamados)

### 4. **administrador**
- **Permissões**: CRUD completo + gerenciamento de usuários
- **Ações permitidas**: 
  - Todas as ações de "gestão tecnica"
  - **Gerenciar usuários**: Criar, editar, deletar usuários
  - Acesso à tela de gerenciamento de usuários (exclusiva para este tipo)

## Endpoints da API

### 1. Login (Autenticação)

**POST** `http://localhost:3000/api/usuarios/login`

Autentica um usuário e retorna seus dados (sem a senha).

**Request Body:**
```json
{
  "nome": "usuario123",
  "senha": "senha123"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "nome": "usuario123",
  "tipo": "gestão tecnica"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Credenciais inválidas"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "nome e senha são obrigatórios"
}
```

**Exemplo de uso com Axios:**
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

const login = async (nome: string, senha: string) => {
  try {
    const response = await api.post('/usuarios/login', { nome, senha });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Erro ao fazer login');
    }
    throw new Error('Erro de conexão');
  }
};
```

**Exemplo de uso com Fetch:**
```typescript
const login = async (nome: string, senha: string) => {
  const response = await fetch('http://localhost:3000/api/usuarios/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nome, senha }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Credenciais inválidas');
  }

  return await response.json();
};
```

---

### 2. Listar Todos os Usuários

**GET** `http://localhost:3000/api/usuarios`

Retorna lista de todos os usuários (sem senhas).

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "nome": "usuario1",
    "tipo": "gestão tecnica"
  },
  {
    "id": 2,
    "nome": "usuario2",
    "tipo": "morador"
  }
]
```

**Nota**: Este endpoint não possui validação de permissão no backend. A validação deve ser feita no frontend baseada no tipo de usuário logado. Apenas `administrador` deve ter acesso a esta funcionalidade.

**Exemplo de uso:**
```typescript
const getUsuarios = async () => {
  const response = await api.get('/usuarios');
  return response.data;
};
```

---

### 3. Buscar Usuário por ID

**GET** `http://localhost:3000/api/usuarios/:id`

Retorna dados de um usuário específico.

**Response (200 OK):**
```json
{
  "id": 1,
  "nome": "usuario1",
  "tipo": "gestão tecnica"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Usuário não encontrado"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "ID inválido"
}
```

**Exemplo de uso:**
```typescript
const getUsuarioById = async (id: number) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};
```

---

### 4. Criar Usuário

**POST** `http://localhost:3000/api/usuarios`

Cria um novo usuário no sistema.

**Request Body:**
```json
{
  "nome": "novo_usuario",
  "senha": "senha123",
  "tipo": "morador"
}
```

**Tipos válidos:**
- `"construtora"`
- `"gestão tecnica"`
- `"morador"`
- `"administrador"`

**Response (201 Created):**
```json
{
  "id": 3,
  "nome": "novo_usuario",
  "tipo": "morador"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "nome, senha e tipo são obrigatórios"
}
```

ou

```json
{
  "error": "tipo deve ser um dos seguintes: construtora, gestão tecnica, morador, administrador"
}
```

ou

```json
{
  "error": "Já existe um usuário com esse nome"
}
```

**Exemplo de uso:**
```typescript
const criarUsuario = async (nome: string, senha: string, tipo: string) => {
  try {
    const response = await api.post('/usuarios', { nome, senha, tipo });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erro ao criar usuário');
  }
};
```

---

### 5. Atualizar Usuário

**PUT** `http://localhost:3000/api/usuarios/:id`

Atualiza dados de um usuário existente.

**Request Body (todos os campos são opcionais):**
```json
{
  "nome": "usuario_atualizado",
  "senha": "nova_senha123",  // Opcional - será hasheada automaticamente
  "tipo": "gestão tecnica"   // Opcional
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "nome": "usuario_atualizado",
  "tipo": "gestão tecnica"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Usuário não encontrado"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "ID inválido"
}
```

ou

```json
{
  "error": "tipo deve ser um dos seguintes: construtora, gestão tecnica, morador, administrador"
}
```

ou

```json
{
  "error": "Já existe outro usuário com esse nome"
}
```

ou

```json
{
  "error": "Nenhum campo para atualizar"
}
```

**Exemplo de uso:**
```typescript
const atualizarUsuario = async (id: number, dados: { nome?: string; senha?: string; tipo?: string }) => {
  try {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erro ao atualizar usuário');
  }
};
```

---

### 6. Deletar Usuário

**DELETE** `http://localhost:3000/api/usuarios/:id`

Remove um usuário do sistema.

**Response (200 OK):**
```json
{
  "message": "Usuário removido com sucesso"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Usuário não encontrado"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "ID inválido"
}
```

**Exemplo de uso:**
```typescript
const deletarUsuario = async (id: number) => {
  try {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw new Error('Erro ao deletar usuário');
  }
};
```

---

## Implementação no Frontend

### 1. Configuração da API (Recomendado)

Crie um arquivo de configuração da API:

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // ✅ Sempre com http://
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Erro da API
      return Promise.reject(new Error(error.response.data.error || 'Erro na requisição'));
    } else if (error.request) {
      // Erro de conexão
      return Promise.reject(new Error('Erro de conexão com o servidor'));
    } else {
      // Outro erro
      return Promise.reject(error);
    }
  }
);

export default api;
```

### 2. Serviço de Usuários

```typescript
// services/usuariosService.ts
import api from './api';

export interface Usuario {
  id: number;
  nome: string;
  tipo: 'construtora' | 'gestão tecnica' | 'morador' | 'administrador';
}

export const usuariosService = {
  login: async (nome: string, senha: string): Promise<Usuario> => {
    const response = await api.post('/usuarios/login', { nome, senha });
    return response.data;
  },

  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  create: async (nome: string, senha: string, tipo: string): Promise<Usuario> => {
    const response = await api.post('/usuarios', { nome, senha, tipo });
    return response.data;
  },

  update: async (id: number, dados: { nome?: string; senha?: string; tipo?: string }): Promise<Usuario> => {
    const response = await api.put(`/usuarios/${id}`, dados);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  },
};
```

### 3. Gerenciamento de Estado do Usuário (Context API)

```typescript
// types/Usuario.ts
export interface Usuario {
  id: number;
  nome: string;
  tipo: 'construtora' | 'gestão tecnica' | 'morador' | 'administrador';
}

// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types/Usuario';
import { usuariosService } from '../services/usuariosService';

interface AuthContextType {
  usuario: Usuario | null;
  login: (nome: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Recuperar usuário do localStorage ao carregar
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      try {
        setUsuario(JSON.parse(usuarioSalvo));
      } catch (error) {
        console.error('Erro ao recuperar usuário:', error);
        localStorage.removeItem('usuario');
      }
    }
  }, []);

  const login = async (nome: string, senha: string) => {
    try {
      const usuarioData = await usuariosService.login(nome, senha);
      setUsuario(usuarioData);
      localStorage.setItem('usuario', JSON.stringify(usuarioData));
    } catch (error: any) {
      throw new Error(error.message || 'Credenciais inválidas');
    }
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  const hasPermission = (action: string): boolean => {
    if (!usuario) return false;

    switch (usuario.tipo) {
      case 'administrador':
        return true; // Pode fazer tudo
      
      case 'gestão tecnica':
        // Pode fazer tudo exceto gerenciar usuários
        return action !== 'gerenciar_usuarios';
      
      case 'morador':
        // Pode apenas ler e criar chamados
        return action === 'ler' || action === 'criar_chamado' || action === 'download';
      
      case 'construtora':
        // Apenas leitura e downloads
        return action === 'ler' || action === 'download';
      
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        isAuthenticated: !!usuario,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
```

### 4. Tela de Login

```typescript
// components/Login.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      await login(nome, senha);
      navigate('/dashboard'); // Redirecionar após login
    } catch (error: any) {
      setErro(error.message || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome de usuário"
        required
        disabled={loading}
      />
      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        required
        disabled={loading}
      />
      {erro && <p style={{ color: 'red' }}>{erro}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};
```

### 5. Proteção de Rotas

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/acesso-negado" />;
  }

  return <>{children}</>;
};
```

### 6. Tela de Gerenciamento de Usuários (Apenas Administrador)

```typescript
// pages/Usuarios.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Usuario } from '../types/Usuario';
import { usuariosService } from '../services/usuariosService';

export const Usuarios = () => {
  const { usuario, hasPermission } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!hasPermission('gerenciar_usuarios')) {
      setLoading(false);
      return;
    }

    const carregarUsuarios = async () => {
      try {
        const data = await usuariosService.getAll();
        setUsuarios(data);
      } catch (error: any) {
        setErro(error.message);
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, [hasPermission]);

  if (!hasPermission('gerenciar_usuarios')) {
    return <div>Acesso negado. Apenas administradores podem gerenciar usuários.</div>;
  }

  if (loading) return <div>Carregando...</div>;
  if (erro) return <div>Erro: {erro}</div>;

  return (
    <div>
      <h1>Gerenciamento de Usuários</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nome}</td>
              <td>{u.tipo}</td>
              <td>
                <button onClick={() => handleEditar(u.id)}>Editar</button>
                <button onClick={() => handleDeletar(u.id)}>Deletar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 7. Controle de Permissões em Componentes

```typescript
// Exemplo: Botão de editar só aparece para usuários com permissão
import { useAuth } from '../context/AuthContext';

export const MeuComponente = () => {
  const { hasPermission } = useAuth();

  return (
    <div>
      <h1>Dados</h1>
      {/* Sempre visível para leitura */}
      <DadosTabela />

      {/* Botões condicionais baseados em permissões */}
      {hasPermission('editar') && (
        <button onClick={handleEditar}>Editar</button>
      )}
      
      {hasPermission('deletar') && (
        <button onClick={handleDeletar}>Deletar</button>
      )}

      {/* Específico para morador criar chamado */}
      {hasPermission('criar_chamado') && (
        <button onClick={handleCriarChamado}>Criar Chamado</button>
      )}
    </div>
  );
};
```

### 8. Tela de Assistência Técnica (Permissão Especial para Morador)

```typescript
// pages/AssistenciaTecnica.tsx
import { useAuth } from '../context/AuthContext';

export const AssistenciaTecnica = () => {
  const { usuario, hasPermission } = useAuth();

  // Todos podem ver os chamados (leitura)
  // Mas apenas morador e gestão tecnica podem criar
  const podeCriar = hasPermission('criar_chamado') || hasPermission('editar');

  return (
    <div>
      <h1>Assistência Técnica</h1>
      
      {/* Lista de chamados - visível para todos */}
      <ListaChamados />

      {/* Botão de criar - apenas para quem tem permissão */}
      {podeCriar && (
        <button onClick={handleCriarChamado}>
          Criar Novo Chamado
        </button>
      )}
    </div>
  );
};
```

## Resumo das Permissões por Tipo

| Ação | construtora | gestão tecnica | morador | administrador |
|------|-------------|----------------|---------|---------------|
| Ler dados | ✅ | ✅ | ✅ | ✅ |
| Download documentos | ✅ | ✅ | ✅ | ✅ |
| Criar chamado | ❌ | ✅ | ✅ | ✅ |
| Editar registros | ❌ | ✅ | ❌ | ✅ |
| Deletar registros | ❌ | ✅ | ❌ | ✅ |
| Criar registros | ❌ | ✅ | ❌ | ✅ |
| Gerenciar usuários | ❌ | ❌ | ❌ | ✅ |

## Notas Importantes

1. **⚠️ URL CORRETA**: Todas as requisições devem usar `/api/usuarios` como prefixo e sempre incluir o protocolo `http://` ou `https://`:
   - `POST http://localhost:3000/api/usuarios/login` (NÃO `/usuarios/login`)
   - `GET http://localhost:3000/api/usuarios` (NÃO `/usuarios`)
   - `GET http://localhost:3000/api/usuarios/:id` (NÃO `/usuarios/:id`)
   - `POST http://localhost:3000/api/usuarios` (NÃO `/usuarios`)
   - `PUT http://localhost:3000/api/usuarios/:id` (NÃO `/usuarios/:id`)
   - `DELETE http://localhost:3000/api/usuarios/:id` (NÃO `/usuarios/:id`)

2. **Segurança**: As senhas são armazenadas com hash bcrypt no backend. Nunca envie senhas em texto plano após o login.

3. **Autenticação**: Atualmente, o sistema usa apenas validação de credenciais. Para produção, considere implementar:
   - JWT (JSON Web Tokens) para sessões
   - Refresh tokens
   - Expiração de sessão

4. **Armazenamento Local**: O exemplo usa `localStorage` para persistir o usuário. Considere usar `sessionStorage` para maior segurança ou implementar tokens JWT.

5. **Validação de Tipos**: Os tipos de usuário são validados no backend. Certifique-se de usar exatamente os valores:
   - `"construtora"`
   - `"gestão tecnica"`
   - `"morador"`
   - `"administrador"`

6. **Tratamento de Erros**: Sempre trate erros de rede e validações no frontend para melhor experiência do usuário. Todos os endpoints retornam erros no formato `{ error: "mensagem" }`.

7. **Validação de Permissões**: O backend não valida permissões nos endpoints CRUD de usuários. A validação deve ser feita no frontend. Apenas usuários do tipo `administrador` devem ter acesso às telas de gerenciamento de usuários.

8. **Validações do Backend**: O backend valida:
   - Campos obrigatórios
   - Tipos de usuário válidos
   - IDs numéricos válidos
   - Nomes únicos (não permite duplicatas)
   - Senhas não vazias

## Próximos Passos

1. Instalar dependências no backend: `npm install` (para instalar bcrypt)
2. Testar os endpoints usando Postman ou similar
3. Implementar autenticação JWT no backend (opcional, mas recomendado)
4. Adicionar middleware de autenticação nas rotas protegidas
5. Implementar refresh tokens para manter sessões ativas
6. Adicionar logs de auditoria para ações de administradores
7. Implementar recuperação de senha (se necessário)
