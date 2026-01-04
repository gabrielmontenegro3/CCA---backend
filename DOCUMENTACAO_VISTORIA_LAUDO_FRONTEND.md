# 📋 Documentação: Sistema de Vistoria / Laudo - Integração Frontend

## 🎯 Objetivo

Esta documentação explica como implementar a funcionalidade de **Vistoria / Laudo** no frontend. O sistema funciona como um chat estruturado, onde cada laudo é associado a um chamado e permite comunicação contínua através de mensagens e arquivos.

---

## 📊 Estrutura do Sistema

### Entidades Principais

1. **Laudo** (`vistoria_laudo`)
   - Contêiner principal que agrupa mensagens e arquivos
   - Associado a um `chamado_id` e `usuario_id` (criador)
   - Possui `titulo` e timestamps (`created_at`, `updated_at`)

2. **Mensagem** (`vistoria_laudo_mensagem`)
   - Sempre pertence a um laudo
   - Possui `mensagem` (texto), `usuario_id` e `created_at`
   - Pode ter arquivos anexados

3. **Arquivo** (`vistoria_laudo_arquivo`)
   - Pode estar associado diretamente ao laudo OU a uma mensagem específica
   - Armazenado no bucket `bucket_fotos_documentos` do Supabase Storage, organizado na pasta `vistoria-laudos/{laudo_id}/`
   - Possui `file_name`, `file_path`, `file_type` e `usuario_id`
   - O `file_path` segue o formato: `vistoria-laudos/{laudo_id}/{timestamp}_{nome_arquivo}`

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api/vistoria-laudos
```

---

## 📝 1. CRUD de Laudos

### 1.1 Criar Laudo

**POST** `/api/vistoria-laudos`

**Headers:**
```
Content-Type: application/json
x-user-id: {usuario_id}  // OBRIGATÓRIO
```

**Body (JSON):**
```json
{
  "titulo": "Laudo de Vistoria - Apartamento 101",
  "chamado_id": 123
}
```

**Validações:**
- `titulo` é obrigatório e não pode ser vazio
- `chamado_id` é obrigatório e deve existir na tabela `chamado`
- `usuario_id` deve ser enviado no header `x-user-id` ou no body como `usuario_id`

**Resposta de Sucesso (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "titulo": "Laudo de Vistoria - Apartamento 101",
  "chamado_id": 123,
  "usuario_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Exemplo de Implementação:**
```typescript
async function criarLaudo(titulo: string, chamadoId: number, usuarioId: number) {
  const response = await fetch('http://localhost:3000/api/vistoria-laudos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': usuarioId.toString()
    },
    body: JSON.stringify({
      titulo,
      chamado_id: chamadoId
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar laudo');
  }

  return await response.json();
}
```

---

### 1.2 Listar Laudos

**GET** `/api/vistoria-laudos?chamado_id={id}`

**Query Parameters (opcional):**
- `chamado_id` - Filtrar laudos por chamado específico

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "titulo": "Laudo de Vistoria - Apartamento 101",
    "chamado_id": 123,
    "usuario_id": 1,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

**Exemplo de Implementação:**
```typescript
async function listarLaudos(chamadoId?: number) {
  const url = chamadoId 
    ? `http://localhost:3000/api/vistoria-laudos?chamado_id=${chamadoId}`
    : 'http://localhost:3000/api/vistoria-laudos';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Erro ao listar laudos');
  }

  return await response.json();
}
```

---

### 1.3 Detalhar Laudo (com Mensagens e Arquivos)

**GET** `/api/vistoria-laudos/:id`

**Resposta de Sucesso (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "titulo": "Laudo de Vistoria - Apartamento 101",
  "chamado_id": 123,
  "usuario_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "mensagens": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
      "usuario_id": 1,
      "mensagem": "Iniciando vistoria do apartamento 101",
      "created_at": "2024-01-15T10:35:00Z",
      "arquivos": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
          "mensagem_id": "660e8400-e29b-41d4-a716-446655440001",
          "usuario_id": 1,
          "file_name": "foto1.jpg",
          "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312500000_foto1.jpg",
          "file_type": "image/jpeg",
          "created_at": "2024-01-15T10:35:30Z"
        }
      ]
    }
  ],
  "arquivos": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
      "mensagem_id": null,
      "usuario_id": 1,
      "file_name": "documento.pdf",
      "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312600000_documento.pdf",
      "file_type": "application/pdf",
      "created_at": "2024-01-15T10:36:00Z"
    }
  ]
}
```

**Observações Importantes:**
- `mensagens` está em ordem cronológica crescente (`created_at` ASC)
- Cada mensagem pode ter um array `arquivos` com seus anexos
- `arquivos` (raiz) são arquivos associados diretamente ao laudo (sem mensagem)
- Arquivos de mensagens têm `mensagem_id` preenchido
- Arquivos do laudo têm `mensagem_id` como `null`

**Exemplo de Implementação:**
```typescript
async function detalharLaudo(laudoId: string) {
  const response = await fetch(`http://localhost:3000/api/vistoria-laudos/${laudoId}`);

  if (!response.ok) {
    throw new Error('Erro ao buscar laudo');
  }

  return await response.json();
}
```

---

### 1.4 Atualizar Laudo

**PUT** `/api/vistoria-laudos/:id`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "titulo": "Laudo Atualizado - Apartamento 101"
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "titulo": "Laudo Atualizado - Apartamento 101",
  "chamado_id": 123,
  "usuario_id": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

---

### 1.5 Excluir Laudo

**DELETE** `/api/vistoria-laudos/:id`

**Observações:**
- A exclusão do laudo **automaticamente deleta** todas as mensagens e arquivos relacionados (cascade)
- Os arquivos também são removidos do Supabase Storage

**Resposta de Sucesso (204):**
```
(sem conteúdo)
```

---

## 💬 2. Mensagens

### 2.1 Criar Mensagem (com Arquivos Opcionais)

**POST** `/api/vistoria-laudos/:vistoria_laudo_id/mensagens`

**Headers:**
```
Content-Type: multipart/form-data
x-user-id: {usuario_id}  // OBRIGATÓRIO
```

**Body (FormData):**
```
mensagem: "Texto da mensagem"
arquivos: [File, File, ...]  // Opcional: múltiplos arquivos
```

**Validações:**
- `mensagem` é obrigatória e não pode ser vazia
- `vistoria_laudo_id` deve existir
- Arquivos são opcionais
- Máximo 10 arquivos por requisição
- Tamanho máximo por arquivo: 10MB

**Resposta de Sucesso (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
  "usuario_id": 1,
  "mensagem": "Texto da mensagem",
  "created_at": "2024-01-15T10:35:00Z",
  "arquivos": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
      "mensagem_id": "660e8400-e29b-41d4-a716-446655440001",
      "usuario_id": 1,
      "file_name": "foto1.jpg",
      "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312500000_foto1.jpg",
      "file_type": "image/jpeg",
      "created_at": "2024-01-15T10:35:30Z"
    }
  ]
}
```

**Exemplo de Implementação:**
```typescript
async function enviarMensagem(
  laudoId: string,
  mensagem: string,
  arquivos: File[],
  usuarioId: number
) {
  const formData = new FormData();
  formData.append('mensagem', mensagem);

  // Adicionar arquivos se houver
  arquivos.forEach((arquivo) => {
    formData.append('arquivos', arquivo);
  });

  const response = await fetch(
    `http://localhost:3000/api/vistoria-laudos/${laudoId}/mensagens`,
    {
      method: 'POST',
      headers: {
        'x-user-id': usuarioId.toString()
        // NÃO incluir Content-Type - o browser define automaticamente com boundary
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao enviar mensagem');
  }

  return await response.json();
}
```

---

### 2.2 Listar Mensagens de um Laudo

**GET** `/api/vistoria-laudos/:vistoria_laudo_id/mensagens`

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
    "usuario_id": 1,
    "mensagem": "Primeira mensagem",
    "created_at": "2024-01-15T10:35:00Z",
    "arquivos": []
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440002",
    "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
    "usuario_id": 2,
    "mensagem": "Segunda mensagem com anexo",
    "created_at": "2024-01-15T10:40:00Z",
    "arquivos": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440003",
        "file_name": "documento.pdf",
        "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312800000_documento.pdf",
        "file_type": "application/pdf",
        "created_at": "2024-01-15T10:40:30Z"
      }
    ]
  }
]
```

**Observações:**
- Mensagens retornadas em ordem cronológica crescente
- Cada mensagem inclui seus arquivos anexados

---

## 📎 3. Arquivos

### 3.1 Upload de Arquivos Diretamente ao Laudo

**POST** `/api/vistoria-laudos/:vistoria_laudo_id/arquivos`

**Headers:**
```
Content-Type: multipart/form-data
x-user-id: {usuario_id}  // OBRIGATÓRIO
```

**Body (FormData):**
```
arquivos: [File, File, ...]  // Múltiplos arquivos
```

**Validações:**
- Pelo menos 1 arquivo é obrigatório
- Máximo 10 arquivos por requisição
- Tamanho máximo por arquivo: 10MB

**Resposta de Sucesso (201):**
```json
{
  "arquivos": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
      "mensagem_id": null,
      "usuario_id": 1,
      "file_name": "documento.pdf",
      "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312600000_documento.pdf",
      "file_type": "application/pdf",
      "created_at": "2024-01-15T10:36:00Z"
    }
  ],
  "erros": []  // Opcional: se algum arquivo falhou
}
```

**Exemplo de Implementação:**
```typescript
async function uploadArquivosLaudo(
  laudoId: string,
  arquivos: File[],
  usuarioId: number
) {
  const formData = new FormData();
  arquivos.forEach((arquivo) => {
    formData.append('arquivos', arquivo);
  });

  const response = await fetch(
    `http://localhost:3000/api/vistoria-laudos/${laudoId}/arquivos`,
    {
      method: 'POST',
      headers: {
        'x-user-id': usuarioId.toString()
      },
      body: formData
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao fazer upload');
  }

  return await response.json();
}
```

---

### 3.2 Listar Arquivos de um Laudo

**GET** `/api/vistoria-laudos/:vistoria_laudo_id/arquivos?mensagem_id={id}`

**Query Parameters (opcional):**
- `mensagem_id` - Filtrar arquivos de uma mensagem específica
- Se não fornecido, retorna apenas arquivos diretos ao laudo (sem mensagem)

**Resposta de Sucesso (200):**
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "vistoria_laudo_id": "550e8400-e29b-41d4-a716-446655440000",
    "mensagem_id": null,
    "usuario_id": 1,
    "file_name": "documento.pdf",
    "file_path": "550e8400-e29b-41d4-a716-446655440000/1705312600000_documento.pdf",
    "file_type": "application/pdf",
    "created_at": "2024-01-15T10:36:00Z",
    "url": "https://storage.supabase.co/...?signature=..."  // URL assinada (válida por 1 hora)
  }
]
```

**Observações:**
- Cada arquivo inclui uma `url` assinada válida por 1 hora
- Para URLs mais longas, use o endpoint de download

---

### 3.3 Obter URL de Download de um Arquivo

**GET** `/api/vistoria-laudos/arquivos/:id/download?expires_in={segundos}`

**Query Parameters (opcional):**
- `expires_in` - Tempo de expiração em segundos (padrão: 3600 = 1 hora)

**Resposta de Sucesso (200):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "file_name": "documento.pdf",
  "file_type": "application/pdf",
  "url": "https://storage.supabase.co/...?signature=...",
  "expires_in": 3600
}
```

**Exemplo de Implementação:**
```typescript
async function obterUrlDownload(arquivoId: string, expiresIn: number = 3600) {
  const response = await fetch(
    `http://localhost:3000/api/vistoria-laudos/arquivos/${arquivoId}/download?expires_in=${expiresIn}`
  );

  if (!response.ok) {
    throw new Error('Erro ao obter URL de download');
  }

  const data = await response.json();
  return data.url; // URL assinada para download
}
```

---

### 3.4 Deletar Arquivo

**DELETE** `/api/vistoria-laudos/arquivos/:id`

**Observações:**
- Remove o arquivo do Supabase Storage e o registro do banco
- Atualiza o `updated_at` do laudo

**Resposta de Sucesso (204):**
```
(sem conteúdo)
```

---

## 🎨 4. Exemplo de Interface de Chat

### Estrutura de Componente React

```typescript
import React, { useState, useEffect } from 'react';

interface Laudo {
  id: string;
  titulo: string;
  chamado_id: number;
  mensagens: Mensagem[];
  arquivos: Arquivo[];
}

interface Mensagem {
  id: string;
  usuario_id: number;
  mensagem: string;
  created_at: string;
  arquivos: Arquivo[];
}

interface Arquivo {
  id: string;
  file_name: string;
  file_type: string;
  url?: string;
}

function VistoriaLaudoChat({ laudoId }: { laudoId: string }) {
  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [arquivosSelecionados, setArquivosSelecionados] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);

  // Carregar laudo com mensagens e arquivos
  useEffect(() => {
    async function carregarLaudo() {
      try {
        const data = await detalharLaudo(laudoId);
        setLaudo(data);
      } catch (error) {
        console.error('Erro ao carregar laudo:', error);
      }
    }
    carregarLaudo();
  }, [laudoId]);

  // Enviar mensagem
  async function handleEnviarMensagem() {
    if (!novaMensagem.trim() && arquivosSelecionados.length === 0) {
      return;
    }

    setEnviando(true);
    try {
      await enviarMensagem(
        laudoId,
        novaMensagem,
        arquivosSelecionados,
        usuarioId // Obter do contexto/state
      );

      // Recarregar laudo
      const data = await detalharLaudo(laudoId);
      setLaudo(data);

      // Limpar formulário
      setNovaMensagem('');
      setArquivosSelecionados([]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setEnviando(false);
    }
  }

  if (!laudo) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="vistoria-chat">
      <h2>{laudo.titulo}</h2>

      {/* Área de mensagens */}
      <div className="mensagens">
        {laudo.mensagens.map((mensagem) => (
          <div key={mensagem.id} className="mensagem">
            <div className="mensagem-header">
              <span>Usuário {mensagem.usuario_id}</span>
              <span>{new Date(mensagem.created_at).toLocaleString()}</span>
            </div>
            <div className="mensagem-texto">{mensagem.mensagem}</div>
            
            {/* Anexos da mensagem */}
            {mensagem.arquivos.length > 0 && (
              <div className="anexos">
                {mensagem.arquivos.map((arquivo) => (
                  <a
                    key={arquivo.id}
                    href={arquivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 {arquivo.file_name}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Área de arquivos do laudo (sem mensagem) */}
      {laudo.arquivos.length > 0 && (
        <div className="arquivos-laudo">
          <h3>Arquivos do Laudo</h3>
          {laudo.arquivos.map((arquivo) => (
            <a
              key={arquivo.id}
              href={arquivo.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              📎 {arquivo.file_name}
            </a>
          ))}
        </div>
      )}

      {/* Formulário de nova mensagem */}
      <div className="nova-mensagem">
        <textarea
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Digite sua mensagem..."
        />
        
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            setArquivosSelecionados(files);
          }}
        />

        <button onClick={handleEnviarMensagem} disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

export default VistoriaLaudoChat;
```

---

## 🔐 5. Autenticação e Permissões

### Identificação do Usuário

A API requer que o `usuario_id` seja enviado em **todas as requisições** através do header:

```
x-user-id: {usuario_id}
```

**Alternativa:** Você pode enviar `usuario_id` no body da requisição, mas o header é preferencial.

### Validações de Segurança

- A API valida a existência do usuário antes de qualquer operação
- A API valida a existência do laudo antes de criar mensagens/arquivos
- A API valida a existência do chamado antes de criar um laudo

---

## ⚠️ 6. Tratamento de Erros

### Códigos de Status HTTP

- **200** - Sucesso (GET, PUT)
- **201** - Criado com sucesso (POST)
- **204** - Deletado com sucesso (DELETE)
- **400** - Erro de validação (dados inválidos)
- **404** - Recurso não encontrado
- **500** - Erro interno do servidor

### Formato de Erro

```json
{
  "error": "Mensagem de erro",
  "message": "Detalhes adicionais (opcional)"
}
```

### Exemplo de Tratamento

```typescript
try {
  const laudo = await criarLaudo(titulo, chamadoId, usuarioId);
  console.log('Laudo criado:', laudo);
} catch (error: any) {
  if (error.message.includes('Chamado não encontrado')) {
    alert('O chamado informado não existe');
  } else if (error.message.includes('Usuário não identificado')) {
    alert('Você precisa estar logado');
  } else {
    alert('Erro ao criar laudo: ' + error.message);
  }
}
```

---

## 📦 7. Estrutura de Dados Completa

### Laudo Completo (GET /api/vistoria-laudos/:id)

```typescript
interface LaudoCompleto {
  id: string;                    // UUID
  titulo: string;
  chamado_id: number;
  usuario_id: number;
  created_at: string;             // ISO 8601
  updated_at: string;             // ISO 8601
  mensagens: MensagemCompleta[];
  arquivos: ArquivoCompleto[];
}

interface MensagemCompleta {
  id: string;                     // UUID
  vistoria_laudo_id: string;
  usuario_id: number;
  mensagem: string;
  created_at: string;             // ISO 8601
  arquivos: ArquivoCompleto[];    // Arquivos anexados a esta mensagem
}

interface ArquivoCompleto {
  id: string;                     // UUID
  vistoria_laudo_id: string;
  mensagem_id: string | null;     // null se for arquivo direto do laudo
  usuario_id: number;
  file_name: string;
  file_path: string;              // Caminho no bucket
  file_type: string;               // MIME type
  created_at: string;              // ISO 8601
  url?: string;                    // URL assinada (quando listado)
}
```

---

## 🚀 8. Fluxo de Uso Recomendado

### 8.1 Criar um Novo Laudo

1. Usuário seleciona um chamado
2. Clica em "Criar Laudo"
3. Preenche o título
4. Chama `POST /api/vistoria-laudos`
5. Redireciona para a tela de chat do laudo

### 8.2 Visualizar Laudo Existente

1. Usuário acessa lista de laudos (filtrado por chamado ou não)
2. Clica em um laudo
3. Chama `GET /api/vistoria-laudos/:id`
4. Renderiza mensagens em ordem cronológica
5. Renderiza arquivos do laudo e de cada mensagem

### 8.3 Enviar Mensagem

1. Usuário digita mensagem (opcional)
2. Seleciona arquivos (opcional)
3. Clica em "Enviar"
4. Chama `POST /api/vistoria-laudos/:id/mensagens`
5. Recarrega o laudo para mostrar a nova mensagem

### 8.4 Upload de Arquivo Direto ao Laudo

1. Usuário clica em "Anexar Arquivo ao Laudo"
2. Seleciona arquivo(s)
3. Chama `POST /api/vistoria-laudos/:id/arquivos`
4. Recarrega o laudo para mostrar os novos arquivos

### 8.5 Download de Arquivo

1. Usuário clica em um arquivo
2. Se o arquivo já tem `url` (válida), usa diretamente
3. Se não, chama `GET /api/vistoria-laudos/arquivos/:id/download`
4. Abre a URL em nova aba ou faz download

---

## ✅ 9. Checklist de Implementação

- [ ] Criar serviço/API client para comunicação com backend
- [ ] Implementar tela de listagem de laudos
- [ ] Implementar tela de criação de laudo
- [ ] Implementar interface de chat (mensagens)
- [ ] Implementar upload de arquivos em mensagens
- [ ] Implementar upload de arquivos diretos ao laudo
- [ ] Implementar visualização/download de arquivos
- [ ] Implementar tratamento de erros
- [ ] Implementar loading states
- [ ] Implementar validações de formulário
- [ ] Testar fluxo completo de criação e comunicação

---

## 📝 10. Observações Importantes

1. **Ordem das Mensagens**: Sempre exiba mensagens em ordem cronológica crescente (`created_at` ASC)

2. **URLs Assinadas**: URLs de arquivos expiram. Sempre gere novas URLs quando necessário usando o endpoint de download

3. **Tamanho de Arquivos**: Limite de 10MB por arquivo e máximo 10 arquivos por requisição

4. **Integridade**: A API garante que não existam arquivos órfãos. Se o upload falhar, a mensagem também não é criada

5. **Cascade Delete**: Ao deletar um laudo, todas as mensagens e arquivos são automaticamente removidos

6. **Atualização de Timestamps**: O `updated_at` do laudo é atualizado automaticamente quando:
   - Uma mensagem é criada
   - Um arquivo é enviado
   - Um arquivo é deletado

---

## 🎯 Conclusão

Esta documentação cobre todos os aspectos necessários para implementar a funcionalidade de Vistoria/Laudo no frontend. O sistema funciona como um chat estruturado, permitindo comunicação contínua com histórico persistente e suporte completo a arquivos.

Para dúvidas ou problemas, verifique os logs do backend e os códigos de erro HTTP retornados pela API.

