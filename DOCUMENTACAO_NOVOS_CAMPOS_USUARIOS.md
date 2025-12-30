# 📋 Documentação: Novos Campos na Tabela de Usuários

## 🎯 OBJETIVO DESTA DOCUMENTAÇÃO

Esta documentação foi criada especificamente para uma IA programadora de frontend. Ela explica as **alterações feitas na tabela de usuários** e como atualizar o código do frontend para usar os novos campos: `telefone`, `telefone2` e `unidade`.

---

## 📊 NOVOS CAMPOS ADICIONADOS

A tabela `usuarios` agora possui **3 novos campos**:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `telefone` | VARCHAR | ❌ Não | Telefone principal do usuário |
| `telefone2` | VARCHAR | ❌ Não | Telefone secundário do usuário (opcional) |
| `unidade` | VARCHAR | ❌ Não | Unidade/identificação do usuário |

**Importante:** Todos os novos campos são **opcionais** (podem ser `null`).

---

## 🔄 ALTERAÇÕES NOS ENDPOINTS

### ✅ TODOS os endpoints foram atualizados para incluir os novos campos

Os seguintes endpoints agora retornam e aceitam os novos campos:

1. **GET** `/api/usuarios` - Listar usuários
2. **GET** `/api/usuarios/:id` - Buscar usuário por ID
3. **POST** `/api/usuarios` - Criar usuário
4. **PUT** `/api/usuarios/:id` - Atualizar usuário
5. **POST** `/api/usuarios/login` - Login (retorna os novos campos)

---

## 📝 DETALHAMENTO DOS ENDPOINTS

### 1. LISTAR USUÁRIOS

**GET** `/api/usuarios`

**Resposta Atualizada (200):**
```json
[
  {
    "id": 1,
    "nome": "João Silva",
    "tipo": "morador",
    "telefone": "(11) 98765-4321",
    "telefone2": "(11) 91234-5678",
    "unidade": "Apto 101"
  },
  {
    "id": 2,
    "nome": "Maria Santos",
    "tipo": "gestão tecnica",
    "telefone": "(11) 99876-5432",
    "telefone2": null,
    "unidade": "Apto 205"
  }
]
```

**Mudanças:**
- ✅ Agora inclui `telefone`, `telefone2` e `unidade` em cada objeto
- ✅ Campos podem ser `null` se não foram preenchidos

---

### 2. BUSCAR USUÁRIO POR ID

**GET** `/api/usuarios/:id`

**Resposta Atualizada (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",
  "telefone2": "(11) 91234-5678",
  "unidade": "Apto 101"
}
```

**Mudanças:**
- ✅ Agora inclui `telefone`, `telefone2` e `unidade`
- ✅ Campos podem ser `null`

---

### 3. CRIAR USUÁRIO

**POST** `/api/usuarios`

**Body Atualizado:**
```json
{
  "nome": "João Silva",
  "senha": "senha123",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",      // ✅ NOVO - Opcional
  "telefone2": "(11) 91234-5678",     // ✅ NOVO - Opcional
  "unidade": "Apto 101"               // ✅ NOVO - Opcional
}
```

**Campos Obrigatórios:**
- `nome` (string) - **OBRIGATÓRIO**
- `senha` (string) - **OBRIGATÓRIO**
- `tipo` (string) - **OBRIGATÓRIO**

**Campos Opcionais:**
- `telefone` (string) - Opcional, pode ser `null` ou omitido
- `telefone2` (string) - Opcional, pode ser `null` ou omitido
- `unidade` (string) - Opcional, pode ser `null` ou omitido

**Resposta Atualizada (201):**
```json
{
  "id": 3,
  "nome": "João Silva",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",
  "telefone2": "(11) 91234-5678",
  "unidade": "Apto 101"
}
```

**Exemplo sem os novos campos (ainda funciona):**
```json
{
  "nome": "Maria Santos",
  "senha": "senha456",
  "tipo": "gestão tecnica"
}
```

**Resposta:**
```json
{
  "id": 4,
  "nome": "Maria Santos",
  "tipo": "gestão tecnica",
  "telefone": null,
  "telefone2": null,
  "unidade": null
}
```

---

### 4. ATUALIZAR USUÁRIO

**PUT** `/api/usuarios/:id`

**Body Atualizado (todos os campos são opcionais):**
```json
{
  "nome": "João Silva Atualizado",
  "senha": "nova_senha123",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",      // ✅ NOVO - Opcional
  "telefone2": "(11) 91234-5678",     // ✅ NOVO - Opcional
  "unidade": "Apto 102"               // ✅ NOVO - Opcional
}
```

**Comportamento:**
- Você pode atualizar apenas os campos que desejar
- Para limpar um campo (definir como `null`), envie `null` ou string vazia `""`
- Campos não enviados não são alterados

**Exemplos:**

**Atualizar apenas telefone:**
```json
{
  "telefone": "(11) 99999-9999"
}
```

**Limpar telefone2 (definir como null):**
```json
{
  "telefone2": null
}
```

**Atualizar múltiplos campos:**
```json
{
  "telefone": "(11) 98765-4321",
  "telefone2": "(11) 91234-5678",
  "unidade": "Apto 201"
}
```

**Resposta Atualizada (200):**
```json
{
  "id": 1,
  "nome": "João Silva Atualizado",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",
  "telefone2": "(11) 91234-5678",
  "unidade": "Apto 102"
}
```

---

### 5. LOGIN

**POST** `/api/usuarios/login`

**Body (não mudou):**
```json
{
  "nome": "joao_silva",
  "senha": "senha123"
}
```

**Resposta Atualizada (200):**
```json
{
  "id": 1,
  "nome": "João Silva",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",      // ✅ NOVO
  "telefone2": "(11) 91234-5678",     // ✅ NOVO
  "unidade": "Apto 101"               // ✅ NOVO
}
```

**Mudanças:**
- ✅ Agora retorna os novos campos `telefone`, `telefone2` e `unidade`
- ✅ Útil para exibir informações do usuário logado

---

## 💻 IMPLEMENTAÇÃO NO FRONTEND

### 1. Atualizar Interface TypeScript

**ANTES:**
```typescript
interface Usuario {
  id: number;
  nome: string;
  tipo: string;
}
```

**DEPOIS:**
```typescript
interface Usuario {
  id: number;
  nome: string;
  tipo: string;
  telefone: string | null;      // ✅ ADICIONAR
  telefone2: string | null;     // ✅ ADICIONAR
  unidade: string | null;       // ✅ ADICIONAR
}
```

---

### 2. Atualizar Service de Usuários

**Exemplo Completo Atualizado:**

```typescript
// services/usuariosService.ts

const API_BASE_URL = 'http://localhost:3000/api';

export interface Usuario {
  id: number;
  nome: string;
  tipo: string;
  telefone: string | null;
  telefone2: string | null;
  unidade: string | null;
}

export interface CriarUsuarioData {
  nome: string;
  senha: string;
  tipo: string;
  telefone?: string | null;
  telefone2?: string | null;
  unidade?: string | null;
}

export interface AtualizarUsuarioData {
  nome?: string;
  senha?: string;
  tipo?: string;
  telefone?: string | null;
  telefone2?: string | null;
  unidade?: string | null;
}

export const usuariosService = {
  // Listar usuários
  listar: async (): Promise<Usuario[]> => {
    const response = await fetch(`${API_BASE_URL}/usuarios`);
    if (!response.ok) {
      throw new Error('Erro ao listar usuários');
    }
    return response.json();
  },

  // Buscar por ID
  buscarPorId: async (id: number): Promise<Usuario> => {
    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar usuário');
    }
    return response.json();
  },

  // Criar usuário
  criar: async (dados: CriarUsuarioData): Promise<Usuario> => {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: dados.nome,
        senha: dados.senha,
        tipo: dados.tipo,
        telefone: dados.telefone || null,
        telefone2: dados.telefone2 || null,
        unidade: dados.unidade || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar usuário');
    }

    return response.json();
  },

  // Atualizar usuário
  atualizar: async (id: number, dados: AtualizarUsuarioData): Promise<Usuario> => {
    const updateData: any = {};

    // Adicionar apenas campos que foram fornecidos
    if (dados.nome !== undefined) updateData.nome = dados.nome;
    if (dados.senha !== undefined) updateData.senha = dados.senha;
    if (dados.tipo !== undefined) updateData.tipo = dados.tipo;
    if (dados.telefone !== undefined) updateData.telefone = dados.telefone || null;
    if (dados.telefone2 !== undefined) updateData.telefone2 = dados.telefone2 || null;
    if (dados.unidade !== undefined) updateData.unidade = dados.unidade || null;

    const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar usuário');
    }

    return response.json();
  },

  // Login
  login: async (nome: string, senha: string): Promise<Usuario> => {
    const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nome, senha })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Credenciais inválidas');
    }

    return response.json();
  }
};
```

---

### 3. Atualizar Componente de Formulário de Criação

**Exemplo Completo:**

```typescript
// components/CriarUsuario.tsx

import React, { useState } from 'react';
import { usuariosService, CriarUsuarioData } from '../services/usuariosService';

export const CriarUsuario: React.FC = () => {
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('morador');
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [unidade, setUnidade] = useState('');
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim() || !senha.trim() || !tipo) {
      setErro('Nome, senha e tipo são obrigatórios');
      return;
    }

    try {
      setCriando(true);

      const dados: CriarUsuarioData = {
        nome: nome.trim(),
        senha,
        tipo,
        telefone: telefone.trim() || null,
        telefone2: telefone2.trim() || null,
        unidade: unidade.trim() || null
      };

      await usuariosService.criar(dados);
      
      alert('Usuário criado com sucesso!');
      
      // Limpar formulário
      setNome('');
      setSenha('');
      setTipo('morador');
      setTelefone('');
      setTelefone2('');
      setUnidade('');
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar usuário');
    } finally {
      setCriando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          Nome <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

      <div>
        <label>
          Senha <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
      </div>

      <div>
        <label>
          Tipo <span style={{ color: 'red' }}>*</span>
        </label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} required>
          <option value="morador">Morador</option>
          <option value="gestão tecnica">Gestão Técnica</option>
          <option value="construtora">Construtora</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      {/* ✅ NOVOS CAMPOS */}
      <div>
        <label>Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 98765-4321"
        />
      </div>

      <div>
        <label>Telefone 2 (Opcional)</label>
        <input
          type="tel"
          value={telefone2}
          onChange={(e) => setTelefone2(e.target.value)}
          placeholder="(11) 91234-5678"
        />
      </div>

      <div>
        <label>Unidade</label>
        <input
          type="text"
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          placeholder="Ex: Apto 101, Bloco A, etc"
        />
      </div>

      {erro && <div style={{ color: 'red' }}>{erro}</div>}

      <button type="submit" disabled={criando}>
        {criando ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  );
};
```

---

### 4. Atualizar Componente de Edição

```typescript
// components/EditarUsuario.tsx

import React, { useState, useEffect } from 'react';
import { usuariosService, Usuario, AtualizarUsuarioData } from '../services/usuariosService';

interface EditarUsuarioProps {
  usuarioId: number;
  onSalvo?: () => void;
}

export const EditarUsuario: React.FC<EditarUsuarioProps> = ({ usuarioId, onSalvo }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefone2, setTelefone2] = useState('');
  const [unidade, setUnidade] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const dados = await usuariosService.buscarPorId(usuarioId);
        setUsuario(dados);
        setNome(dados.nome);
        setTipo(dados.tipo);
        setTelefone(dados.telefone || '');
        setTelefone2(dados.telefone2 || '');
        setUnidade(dados.unidade || '');
      } catch (error: any) {
        setErro(error.message);
      }
    };

    carregarUsuario();
  }, [usuarioId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    try {
      setSalvando(true);

      const dados: AtualizarUsuarioData = {
        nome: nome.trim(),
        tipo,
        telefone: telefone.trim() || null,
        telefone2: telefone2.trim() || null,
        unidade: unidade.trim() || null
      };

      await usuariosService.atualizar(usuarioId, dados);
      
      if (onSalvo) {
        onSalvo();
      }
      
      alert('Usuário atualizado com sucesso!');
    } catch (error: any) {
      setErro(error.message || 'Erro ao atualizar usuário');
    } finally {
      setSalvando(false);
    }
  };

  if (!usuario) {
    return <div>Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div>
        <label>Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="morador">Morador</option>
          <option value="gestão tecnica">Gestão Técnica</option>
          <option value="construtora">Construtora</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>

      {/* ✅ NOVOS CAMPOS */}
      <div>
        <label>Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 98765-4321"
        />
      </div>

      <div>
        <label>Telefone 2</label>
        <input
          type="tel"
          value={telefone2}
          onChange={(e) => setTelefone2(e.target.value)}
          placeholder="(11) 91234-5678"
        />
      </div>

      <div>
        <label>Unidade</label>
        <input
          type="text"
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          placeholder="Ex: Apto 101"
        />
      </div>

      {erro && <div style={{ color: 'red' }}>{erro}</div>}

      <button type="submit" disabled={salvando}>
        {salvando ? 'Salvando...' : 'Salvar Alterações'}
      </button>
    </form>
  );
};
```

---

### 5. Atualizar Componente de Listagem

```typescript
// components/ListaUsuarios.tsx

import React, { useEffect, useState } from 'react';
import { usuariosService, Usuario } from '../services/usuariosService';

export const ListaUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarUsuarios = async () => {
      try {
        const dados = await usuariosService.listar();
        setUsuarios(dados);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarUsuarios();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Tipo</th>
          <th>Telefone</th>        {/* ✅ NOVO */}
          <th>Telefone 2</th>      {/* ✅ NOVO */}
          <th>Unidade</th>         {/* ✅ NOVO */}
        </tr>
      </thead>
      <tbody>
        {usuarios.map((usuario) => (
          <tr key={usuario.id}>
            <td>{usuario.id}</td>
            <td>{usuario.nome}</td>
            <td>{usuario.tipo}</td>
            <td>{usuario.telefone || '-'}</td>      {/* ✅ NOVO */}
            <td>{usuario.telefone2 || '-'}</td>      {/* ✅ NOVO */}
            <td>{usuario.unidade || '-'}</td>       {/* ✅ NOVO */}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

### 6. Atualizar Context/Auth (se usar)

```typescript
// context/AuthContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../services/usuariosService';
import { usuariosService } from '../services/usuariosService';

interface AuthContextType {
  usuario: Usuario | null;
  login: (nome: string, senha: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    // Recuperar usuário do localStorage
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
    const usuarioData = await usuariosService.login(nome, senha);
    setUsuario(usuarioData);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem('usuario');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        login,
        logout,
        isAuthenticated: !!usuario
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

**Uso no componente:**
```typescript
const { usuario } = useAuth();

// Agora você pode acessar os novos campos
console.log(usuario?.telefone);
console.log(usuario?.telefone2);
console.log(usuario?.unidade);
```

---

## ✅ CHECKLIST DE ATUALIZAÇÃO

### Interfaces TypeScript
- [ ] Atualizar interface `Usuario` para incluir `telefone`, `telefone2`, `unidade`
- [ ] Atualizar interface `CriarUsuarioData` para incluir novos campos opcionais
- [ ] Atualizar interface `AtualizarUsuarioData` para incluir novos campos opcionais

### Services
- [ ] Atualizar método `listar()` - já retorna novos campos automaticamente
- [ ] Atualizar método `buscarPorId()` - já retorna novos campos automaticamente
- [ ] Atualizar método `criar()` - aceitar novos campos no body
- [ ] Atualizar método `atualizar()` - aceitar novos campos no body
- [ ] Atualizar método `login()` - já retorna novos campos automaticamente

### Componentes
- [ ] Atualizar componente de criação de usuário - adicionar campos de telefone e unidade
- [ ] Atualizar componente de edição de usuário - adicionar campos de telefone e unidade
- [ ] Atualizar componente de listagem - exibir novos campos
- [ ] Atualizar componente de detalhes do usuário - exibir novos campos
- [ ] Atualizar contexto de autenticação (se usar) - armazenar novos campos

### Validações (Opcional)
- [ ] Adicionar validação de formato de telefone (opcional)
- [ ] Adicionar máscara de telefone nos inputs (opcional)
- [ ] Adicionar validação de unidade (opcional)

---

## 📝 EXEMPLOS DE USO

### Criar Usuário com Todos os Campos

```typescript
await usuariosService.criar({
  nome: 'João Silva',
  senha: 'senha123',
  tipo: 'morador',
  telefone: '(11) 98765-4321',
  telefone2: '(11) 91234-5678',
  unidade: 'Apto 101'
});
```

### Criar Usuário sem Novos Campos (ainda funciona)

```typescript
await usuariosService.criar({
  nome: 'Maria Santos',
  senha: 'senha456',
  tipo: 'gestão tecnica'
  // telefone, telefone2 e unidade serão null
});
```

### Atualizar Apenas Telefone

```typescript
await usuariosService.atualizar(1, {
  telefone: '(11) 99999-9999'
});
```

### Limpar Telefone2 (definir como null)

```typescript
await usuariosService.atualizar(1, {
  telefone2: null
});
```

### Atualizar Múltiplos Campos

```typescript
await usuariosService.atualizar(1, {
  telefone: '(11) 98765-4321',
  telefone2: '(11) 91234-5678',
  unidade: 'Apto 201'
});
```

---

## ⚠️ IMPORTANTE: COMPATIBILIDADE

### ✅ Retrocompatibilidade Mantida

- Endpoints **continuam funcionando** mesmo sem os novos campos
- Se você não enviar `telefone`, `telefone2` ou `unidade`, eles serão `null`
- Se você não atualizar o frontend imediatamente, **não quebra nada**
- Os novos campos aparecem como `null` nas respostas antigas

### 🔄 Migração Gradual

Você pode atualizar o frontend gradualmente:

1. **Fase 1:** Atualizar interfaces TypeScript (para evitar erros de tipo)
2. **Fase 2:** Atualizar formulários de criação/edição (adicionar campos)
3. **Fase 3:** Atualizar listagens e exibições (mostrar novos campos)

---

## 🎨 SUGESTÕES DE UI

### Máscara de Telefone (Opcional)

```typescript
// utils/mascaraTelefone.ts

export function formatarTelefone(value: string): string {
  // Remove tudo que não é número
  const numeros = value.replace(/\D/g, '');
  
  // Aplica máscara (11) 98765-4321
  if (numeros.length <= 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  } else {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
}

// Uso no componente
<input
  type="tel"
  value={telefone}
  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
  placeholder="(11) 98765-4321"
  maxLength={15}
/>
```

### Validação de Telefone (Opcional)

```typescript
function validarTelefone(telefone: string): boolean {
  // Remove caracteres não numéricos
  const numeros = telefone.replace(/\D/g, '');
  // Telefone deve ter 10 ou 11 dígitos
  return numeros.length === 10 || numeros.length === 11;
}
```

---

## 📊 RESUMO DAS MUDANÇAS

| Endpoint | Mudança |
|----------|---------|
| **GET /usuarios** | ✅ Agora retorna `telefone`, `telefone2`, `unidade` |
| **GET /usuarios/:id** | ✅ Agora retorna `telefone`, `telefone2`, `unidade` |
| **POST /usuarios** | ✅ Agora aceita `telefone`, `telefone2`, `unidade` (opcionais) |
| **PUT /usuarios/:id** | ✅ Agora aceita `telefone`, `telefone2`, `unidade` (opcionais) |
| **POST /usuarios/login** | ✅ Agora retorna `telefone`, `telefone2`, `unidade` |

---

## 🔍 TESTANDO AS MUDANÇAS

### Teste 1: Criar Usuário com Novos Campos
```bash
POST http://localhost:3000/api/usuarios
{
  "nome": "Teste",
  "senha": "123",
  "tipo": "morador",
  "telefone": "(11) 98765-4321",
  "telefone2": "(11) 91234-5678",
  "unidade": "Apto 101"
}
```

### Teste 2: Criar Usuário sem Novos Campos (deve funcionar)
```bash
POST http://localhost:3000/api/usuarios
{
  "nome": "Teste2",
  "senha": "123",
  "tipo": "morador"
}
```

### Teste 3: Atualizar Apenas Telefone
```bash
PUT http://localhost:3000/api/usuarios/1
{
  "telefone": "(11) 99999-9999"
}
```

### Teste 4: Listar Usuários (deve incluir novos campos)
```bash
GET http://localhost:3000/api/usuarios
```

---

**Última atualização:** 30/12/2025
**Versão da API:** 1.0.0
**Status:** ✅ Backend atualizado - Frontend precisa atualizar interfaces e componentes

