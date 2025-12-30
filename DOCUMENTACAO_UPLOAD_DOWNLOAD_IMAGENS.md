# 📸 Documentação: Upload e Download de Imagens para Chamados

## 🎯 Objetivo

Esta documentação explica como implementar a funcionalidade de **upload e download de imagens** no frontend, onde cada imagem está **atrelada a um chamado**. As imagens são armazenadas no bucket `bucket_fotos_documentos` do Supabase Storage usando AWS SDK.

---

## 📋 Estrutura da Tabela `imagens`

A tabela `imagens` possui os seguintes campos:

```sql
CREATE TABLE imagens (
  id SERIAL PRIMARY KEY,
  path VARCHAR(255) NOT NULL,        -- Caminho do arquivo no bucket (ex: "1/1234567890_foto.jpg")
  bucket VARCHAR(255) NOT NULL,      -- Nome do bucket ("bucket_fotos_documentos")
  chamado_id INTEGER NOT NULL,        -- ID do chamado (FK para tabela chamado)
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Campos:**
- `id` - ID único da imagem
- `path` - Caminho completo do arquivo no bucket (formato: `{chamado_id}/{timestamp}_{nome_original}`)
- `bucket` - Nome do bucket (sempre `bucket_fotos_documentos`)
- `chamado_id` - **OBRIGATÓRIO** - ID do chamado ao qual a imagem pertence
- `created_at` - Data de criação (automático)

---

## 🔌 Endpoints da API

### Base URL
```
http://localhost:3000/api
```

---

### 1. 📤 Upload de Imagem

**POST** `/api/imagens/upload`

**Content-Type:** `multipart/form-data`

**Body (FormData):**
- `file` (File) - **OBRIGATÓRIO** - Arquivo de imagem (máximo 10MB)
- `chamado_id` (number) - **OBRIGATÓRIO** - ID do chamado

**Validações:**
- Apenas arquivos de imagem são aceitos (`image/*`)
- Tamanho máximo: 10MB
- O `chamado_id` deve existir na tabela `chamado`

**Resposta de Sucesso (201):**
```json
{
  "id": 1,
  "path": "1/1704067200000_foto.jpg",
  "bucket": "bucket_fotos_documentos",
  "chamado_id": 1,
  "created_at": "2025-01-01T12:00:00.000Z",
  "url": "https://fvkyqmvlqplgzdtybqhh.storage.supabase.co/storage/v1/s3/bucket_fotos_documentos/1/1704067200000_foto.jpg?X-Amz-Algorithm=...",
  "tamanho": 245760,
  "tipo": "image/jpeg",
  "nome_original": "foto.jpg"
}
```

**Resposta de Erro (400):**
```json
{
  "error": "chamado_id é obrigatório e deve ser um número válido"
}
```

**Resposta de Erro (400) - Chamado não encontrado:**
```json
{
  "error": "Chamado não encontrado"
}
```

**Resposta de Erro (400) - Sem arquivo:**
```json
{
  "error": "Nenhum arquivo enviado. Use multipart/form-data com campo 'file'"
}
```

---

### 2. 📥 Listar Imagens

**GET** `/api/imagens`

**Query Parameters (opcionais):**
- `chamado_id` (number) - Filtrar imagens por chamado

**Exemplos:**
- `GET /api/imagens` - Lista todas as imagens
- `GET /api/imagens?chamado_id=1` - Lista apenas imagens do chamado 1

**Resposta de Sucesso (200):**
```json
[
  {
    "id": 1,
    "path": "1/1704067200000_foto.jpg",
    "bucket": "bucket_fotos_documentos",
    "chamado_id": 1,
    "created_at": "2025-01-01T12:00:00.000Z",
    "url": "https://fvkyqmvlqplgzdtybqhh.storage.supabase.co/storage/v1/s3/..."
  },
  {
    "id": 2,
    "path": "1/1704067300000_outra_foto.png",
    "bucket": "bucket_fotos_documentos",
    "chamado_id": 1,
    "created_at": "2025-01-01T12:01:40.000Z",
    "url": "https://fvkyqmvlqplgzdtybqhh.storage.supabase.co/storage/v1/s3/..."
  }
]
```

**Nota:** As URLs são **assinadas** e válidas por **1 hora**. Após expirar, é necessário buscar novamente a lista ou usar o endpoint de download.

---

### 3. 🔍 Buscar Imagem por ID

**GET** `/api/imagens/:id`

**Parâmetros:**
- `id` (number) - ID da imagem

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "path": "1/1704067200000_foto.jpg",
  "bucket": "bucket_fotos_documentos",
  "chamado_id": 1,
  "created_at": "2025-01-01T12:00:00.000Z",
  "url": "https://fvkyqmvlqplgzdtybqhh.storage.supabase.co/storage/v1/s3/..."
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Imagem não encontrada"
}
```

---

### 4. ⬇️ Download de Imagem (Gerar URL Assinada)

**GET** `/api/imagens/:id/download`

**Parâmetros:**
- `id` (number) - ID da imagem

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "url": "https://fvkyqmvlqplgzdtybqhh.storage.supabase.co/storage/v1/s3/...",
  "path": "1/1704067200000_foto.jpg",
  "bucket": "bucket_fotos_documentos",
  "chamado_id": 1,
  "expires_in": 3600
}
```

**Nota:** A URL é válida por **1 hora** (3600 segundos). Use este endpoint quando a URL da lista expirar.

---

### 5. 🗑️ Remover Imagem

**DELETE** `/api/imagens/:id`

**Parâmetros:**
- `id` (number) - ID da imagem

**Resposta de Sucesso (200):**
```json
{
  "message": "Imagem removida com sucesso"
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Imagem não encontrada"
}
```

**Nota:** Remove tanto o arquivo do storage quanto o registro no banco de dados.

---

## 💻 Implementação no Frontend

### 1. Service/API Client

Crie um arquivo de serviço para gerenciar as requisições de imagens:

```typescript
// services/imagemService.ts

const API_BASE_URL = 'http://localhost:3000/api';

export interface Imagem {
  id: number;
  path: string;
  bucket: string;
  chamado_id: number;
  created_at: string;
  url?: string;
  tamanho?: number;
  tipo?: string;
  nome_original?: string;
}

export interface UploadResponse extends Imagem {
  url: string;
  tamanho: number;
  tipo: string;
  nome_original: string;
}

export const imagemService = {
  // Listar imagens (opcionalmente filtrar por chamado_id)
  listar: async (chamadoId?: number): Promise<Imagem[]> => {
    const url = chamadoId 
      ? `${API_BASE_URL}/imagens?chamado_id=${chamadoId}`
      : `${API_BASE_URL}/imagens`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erro ao listar imagens');
    }
    return response.json();
  },

  // Buscar imagem por ID
  buscarPorId: async (id: number): Promise<Imagem> => {
    const response = await fetch(`${API_BASE_URL}/imagens/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar imagem');
    }
    return response.json();
  },

  // Upload de imagem
  upload: async (file: File, chamadoId: number): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chamado_id', chamadoId.toString());

    const response = await fetch(`${API_BASE_URL}/imagens/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload da imagem');
    }

    return response.json();
  },

  // Gerar URL de download (renovar URL expirada)
  download: async (id: number): Promise<{ url: string; expires_in: number }> => {
    const response = await fetch(`${API_BASE_URL}/imagens/${id}/download`);
    if (!response.ok) {
      throw new Error('Erro ao gerar URL de download');
    }
    return response.json();
  },

  // Remover imagem
  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/imagens/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Erro ao remover imagem');
    }
  }
};
```

---

### 2. Componente de Upload de Imagem

Exemplo de componente React para upload:

```typescript
// components/UploadImagem.tsx

import React, { useState } from 'react';
import { imagemService, UploadResponse } from '../services/imagemService';

interface UploadImagemProps {
  chamadoId: number;
  onUploadSuccess?: (imagem: UploadResponse) => void;
  onUploadError?: (error: string) => void;
}

export const UploadImagem: React.FC<UploadImagemProps> = ({
  chamadoId,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Apenas arquivos de imagem são permitidos');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 10MB');
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Selecione um arquivo');
      return;
    }

    try {
      setUploading(true);
      const resultado = await imagemService.upload(selectedFile, chamadoId);
      
      alert('Imagem enviada com sucesso!');
      setSelectedFile(null);
      setPreview(null);
      
      if (onUploadSuccess) {
        onUploadSuccess(resultado);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao fazer upload';
      alert(`Erro: ${errorMessage}`);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-imagem">
      <h3>Enviar Imagem</h3>
      
      <div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px' }} />
        </div>
      )}

      <button 
        onClick={handleUpload} 
        disabled={uploading || !selectedFile}
      >
        {uploading ? 'Enviando...' : 'Enviar Imagem'}
      </button>
    </div>
  );
};
```

---

### 3. Componente de Galeria de Imagens

Exemplo de componente para exibir imagens de um chamado:

```typescript
// components/GaleriaImagens.tsx

import React, { useEffect, useState } from 'react';
import { imagemService, Imagem } from '../services/imagemService';

interface GaleriaImagensProps {
  chamadoId: number;
}

export const GaleriaImagens: React.FC<GaleriaImagensProps> = ({ chamadoId }) => {
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarImagens = async () => {
    try {
      setLoading(true);
      const dados = await imagemService.listar(chamadoId);
      setImagens(dados);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarImagens();
  }, [chamadoId]);

  const handleRemover = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta imagem?')) {
      return;
    }

    try {
      await imagemService.remover(id);
      alert('Imagem removida com sucesso!');
      carregarImagens(); // Recarregar lista
    } catch (err: any) {
      alert(`Erro ao remover: ${err.message}`);
    }
  };

  const handleRenovarUrl = async (id: number) => {
    try {
      const { url } = await imagemService.download(id);
      // Atualizar a URL na lista
      setImagens(prev => 
        prev.map(img => img.id === id ? { ...img, url } : img)
      );
    } catch (err: any) {
      alert(`Erro ao renovar URL: ${err.message}`);
    }
  };

  if (loading) {
    return <div>Carregando imagens...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (imagens.length === 0) {
    return <div>Nenhuma imagem encontrada para este chamado.</div>;
  }

  return (
    <div className="galeria-imagens">
      <h3>Imagens do Chamado ({imagens.length})</h3>
      
      <div className="grid-imagens">
        {imagens.map((imagem) => (
          <div key={imagem.id} className="imagem-item">
            {imagem.url ? (
              <img 
                src={imagem.url} 
                alt={`Imagem ${imagem.id}`}
                style={{ maxWidth: '200px', maxHeight: '200px' }}
                onError={() => {
                  // Se a URL expirou, tentar renovar
                  handleRenovarUrl(imagem.id);
                }}
              />
            ) : (
              <div>Carregando...</div>
            )}
            
            <div className="acoes">
              <button onClick={() => handleRenovarUrl(imagem.id)}>
                Renovar URL
              </button>
              <button onClick={() => handleRemover(imagem.id)}>
                Remover
              </button>
            </div>
            
            <div className="info">
              <small>
                {imagem.nome_original || imagem.path} - 
                {imagem.tamanho ? ` ${(imagem.tamanho / 1024).toFixed(2)} KB` : ''}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 4. Exemplo de Uso Completo (Tela de Chamado)

```typescript
// pages/ChamadoDetalhes.tsx

import React, { useState, useEffect } from 'react';
import { UploadImagem } from '../components/UploadImagem';
import { GaleriaImagens } from '../components/GaleriaImagens';
import { imagemService, UploadResponse } from '../services/imagemService';

export const ChamadoDetalhes: React.FC<{ chamadoId: number }> = ({ chamadoId }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = (imagem: UploadResponse) => {
    console.log('Imagem enviada:', imagem);
    // Forçar atualização da galeria
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="chamado-detalhes">
      <h2>Chamado #{chamadoId}</h2>
      
      {/* Seção de Upload */}
      <section>
        <UploadImagem 
          chamadoId={chamadoId}
          onUploadSuccess={handleUploadSuccess}
        />
      </section>

      {/* Seção de Galeria */}
      <section>
        <GaleriaImagens 
          key={refreshKey}
          chamadoId={chamadoId} 
        />
      </section>
    </div>
  );
};
```

---

## ⚠️ Observações Importantes

### 1. URLs Assinadas

- As URLs retornadas são **assinadas** e válidas por **1 hora**
- Após expirar, use o endpoint `/api/imagens/:id/download` para renovar
- Ou recarregue a lista de imagens para obter novas URLs

### 2. Validações no Frontend

- **Tipo de arquivo**: Apenas imagens (`image/*`)
- **Tamanho máximo**: 10MB
- **chamado_id**: Deve ser um número válido e o chamado deve existir

### 3. Tratamento de Erros

Sempre trate os erros adequadamente:

```typescript
try {
  await imagemService.upload(file, chamadoId);
} catch (error: any) {
  if (error.message.includes('Chamado não encontrado')) {
    alert('O chamado especificado não existe');
  } else if (error.message.includes('Nenhum arquivo')) {
    alert('Selecione um arquivo antes de enviar');
  } else {
    alert(`Erro: ${error.message}`);
  }
}
```

### 4. Estrutura de Pastas no Bucket

As imagens são organizadas por chamado:
```
bucket_fotos_documentos/
  ├── 1/                    (chamado_id = 1)
  │   ├── 1704067200000_foto.jpg
  │   └── 1704067300000_outra_foto.png
  ├── 2/                    (chamado_id = 2)
  │   └── 1704067400000_imagem.jpg
  └── ...
```

---

## 🧪 Testando a API

### Usando cURL

**Upload:**
```bash
curl -X POST http://localhost:3000/api/imagens/upload \
  -F "file=@/caminho/para/imagem.jpg" \
  -F "chamado_id=1"
```

**Listar imagens:**
```bash
curl http://localhost:3000/api/imagens?chamado_id=1
```

**Download (gerar URL):**
```bash
curl http://localhost:3000/api/imagens/1/download
```

**Remover:**
```bash
curl -X DELETE http://localhost:3000/api/imagens/1
```

---

## ✅ Checklist de Implementação

- [ ] Criar service `imagemService.ts` com todas as funções
- [ ] Criar componente `UploadImagem` para upload
- [ ] Criar componente `GaleriaImagens` para exibir imagens
- [ ] Integrar na tela de detalhes do chamado
- [ ] Adicionar tratamento de erros
- [ ] Adicionar loading states
- [ ] Testar upload de diferentes formatos (JPG, PNG, etc.)
- [ ] Testar validação de tamanho máximo
- [ ] Testar renovação de URLs expiradas
- [ ] Testar remoção de imagens

---

## 📝 Resumo dos Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/imagens` | Listar todas as imagens (opcional: `?chamado_id=1`) |
| GET | `/api/imagens/:id` | Buscar imagem por ID |
| POST | `/api/imagens/upload` | Upload de imagem (multipart/form-data) |
| GET | `/api/imagens/:id/download` | Gerar URL assinada para download |
| DELETE | `/api/imagens/:id` | Remover imagem |

---

**Última atualização:** 30/12/2025
**Versão da API:** 1.0.0

