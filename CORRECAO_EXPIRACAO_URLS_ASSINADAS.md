# 🔧 Correção: Erro de Expiração de URLs Assinadas

## 🐛 Problema Identificado

O erro `"Signature version 4 presigned URLs must have an expiration date less than one week in the future"` ocorre porque o AWS S3 (e Supabase Storage compatível) tem um **limite máximo de 1 semana (7 dias)** para URLs assinadas.

O código estava tentando gerar URLs válidas por **1 ano**, o que excede o limite permitido.

## ✅ Correção Aplicada

### Antes (ERRADO):
```typescript
const url = await getSignedUrl(s3Client, getObjectCommand, { 
  expiresIn: 31536000 // 1 ano - EXCEDE O LIMITE!
});
```

### Depois (CORRETO):
```typescript
const url = await getSignedUrl(s3Client, getObjectCommand, { 
  expiresIn: 604800 // 7 dias - MÁXIMO PERMITIDO
});
```

## 📋 Limites de Expiração

| Serviço | Limite Máximo | Em Segundos |
|---------|---------------|-------------|
| AWS S3 | 1 semana | 604800 |
| Supabase Storage (S3 compatível) | 1 semana | 604800 |

**Nota:** O limite de 1 semana é uma restrição do protocolo S3 Signature Version 4 e não pode ser alterado.

## 🔄 Impacto no Frontend

### ⚠️ IMPORTANTE: URLs Expirarão Após 7 Dias

As URLs retornadas pelo backend agora expiram após **7 dias** (não mais 1 ano). Isso significa que:

1. **URLs de anexos** em chamados expiram após 7 dias
2. **URLs de imagens** expiram após 7 dias
3. O frontend precisa **renovar URLs expiradas** quando necessário

## 💻 Como Tratar URLs Expiradas no Frontend

### Opção 1: Renovar URL ao Detectar Expiração

```typescript
// services/chamadoService.ts

export const chamadoService = {
  // Buscar chamado e renovar URLs se necessário
  buscarPorId: async (id: number): Promise<Chamado> => {
    const response = await fetch(`${API_BASE_URL}/chamados/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar chamado');
    }

    const chamado = await response.json();
    
    // Verificar e renovar URLs expiradas
    if (chamado.mensagens) {
      for (const mensagem of chamado.mensagens) {
        for (const anexo of mensagem.anexos) {
          // Tentar carregar a imagem/arquivo
          try {
            const testResponse = await fetch(anexo.url, { method: 'HEAD' });
            if (!testResponse.ok) {
              // URL expirada, buscar novamente o chamado para renovar
              return await chamadoService.buscarPorId(id);
            }
          } catch {
            // URL expirada, buscar novamente
            return await chamadoService.buscarPorId(id);
          }
        }
      }
    }

    return chamado;
  }
};
```

### Opção 2: Tratar Erro 403/404 ao Carregar Imagens

```typescript
// components/ChatChamado.tsx

const [chamado, setChamado] = useState<Chamado | null>(null);

// Função para renovar URLs quando necessário
const renovarUrls = async () => {
  if (chamadoId) {
    const dados = await chamadoService.buscarPorId(chamadoId);
    setChamado(dados);
  }
};

// Componente de imagem com tratamento de erro
const ImagemAnexo: React.FC<{ anexo: Anexo }> = ({ anexo }) => {
  const [url, setUrl] = useState(anexo.url);
  const [erro, setErro] = useState(false);

  const handleError = async () => {
    if (!erro) {
      setErro(true);
      // Tentar renovar URLs
      await renovarUrls();
    }
  };

  return (
    <img
      src={url}
      alt="Anexo"
      onError={handleError}
      style={{ maxWidth: '200px', maxHeight: '200px' }}
    />
  );
};
```

### Opção 3: Armazenar URLs com Timestamp e Renovar Automaticamente

```typescript
// utils/urlManager.ts

interface UrlCache {
  url: string;
  expiresAt: number; // Timestamp
}

const urlCache = new Map<string, UrlCache>();

export function getCachedUrl(anexoId: number, originalUrl: string): string {
  const cached = urlCache.get(`anexo-${anexoId}`);
  const now = Date.now();
  
  // Se a URL está expirada ou não existe no cache, retornar original
  // (será renovada na próxima busca)
  if (!cached || cached.expiresAt < now) {
    return originalUrl;
  }
  
  return cached.url;
}

export function cacheUrl(anexoId: number, url: string) {
  // Cache válido por 6 dias (renovar antes de expirar)
  const expiresAt = Date.now() + (6 * 24 * 60 * 60 * 1000);
  urlCache.set(`anexo-${anexoId}`, { url, expiresAt });
}
```

## 📝 Estratégia Recomendada

### Para URLs de Anexos em Chamados:

1. **Ao buscar chamado:** As URLs já vêm renovadas (válidas por 7 dias)
2. **Ao exibir anexos:** Se a URL falhar (erro 403/404), buscar o chamado novamente para renovar URLs
3. **Cache local:** Armazenar URLs com timestamp e renovar quando próximo de expirar

### Exemplo de Implementação Completa:

```typescript
// hooks/useChamado.ts

import { useState, useEffect } from 'react';
import { chamadoService, Chamado } from '../services/chamadoService';

export const useChamado = (chamadoId: number) => {
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarChamado = async () => {
    try {
      setLoading(true);
      const dados = await chamadoService.buscarPorId(chamadoId);
      setChamado(dados);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarChamado();
    
    // Renovar URLs a cada 6 dias (antes de expirar)
    const interval = setInterval(() => {
      carregarChamado();
    }, 6 * 24 * 60 * 60 * 1000); // 6 dias

    return () => clearInterval(interval);
  }, [chamadoId]);

  const renovarUrls = () => {
    carregarChamado();
  };

  return { chamado, loading, error, renovarUrls };
};
```

## 🎨 Componente de Anexo com Tratamento de Erro

```typescript
// components/AnexoImagem.tsx

import React, { useState } from 'react';
import { Anexo } from '../services/chamadoService';

interface AnexoImagemProps {
  anexo: Anexo;
  onRenovarUrls?: () => void;
}

export const AnexoImagem: React.FC<AnexoImagemProps> = ({ anexo, onRenovarUrls }) => {
  const [url, setUrl] = useState(anexo.url);
  const [erro, setErro] = useState(false);
  const [tentandoRenovar, setTentandoRenovar] = useState(false);

  const handleError = async () => {
    if (erro || tentandoRenovar) return;
    
    setErro(true);
    setTentandoRenovar(true);

    // Tentar renovar URLs
    if (onRenovarUrls) {
      try {
        await onRenovarUrls();
        // Aguardar um pouco e tentar novamente
        setTimeout(() => {
          setUrl(anexo.url + '?t=' + Date.now()); // Forçar reload
          setTentandoRenovar(false);
        }, 1000);
      } catch {
        setTentandoRenovar(false);
      }
    }
  };

  if (anexo.tipo.startsWith('image/')) {
    return (
      <div className="anexo-imagem">
        {erro && !tentandoRenovar && (
          <div className="erro-url">
            <p>Imagem não disponível</p>
            <button onClick={handleError}>Tentar novamente</button>
          </div>
        )}
        <img
          src={url}
          alt="Anexo"
          onError={handleError}
          style={{ 
            maxWidth: '200px', 
            maxHeight: '200px',
            display: erro && !tentandoRenovar ? 'none' : 'block'
          }}
        />
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onError={handleError}>
      📎 {anexo.tipo}
    </a>
  );
};
```

## ✅ Checklist de Implementação

- [ ] Entender que URLs expiram após 7 dias (não mais 1 ano)
- [ ] Implementar tratamento de erro ao carregar imagens/arquivos
- [ ] Adicionar função para renovar URLs quando necessário
- [ ] Considerar cache local de URLs com timestamp
- [ ] Implementar renovação automática antes de expirar (ex: a cada 6 dias)
- [ ] Adicionar feedback visual quando URL expirar
- [ ] Testar comportamento com URLs expiradas

## 📊 Resumo das Mudanças

### Backend:
- ✅ Tempo de expiração alterado de 1 ano para 7 dias (máximo permitido)
- ✅ URLs de anexos válidas por 7 dias
- ✅ URLs de imagens válidas por 7 dias (ou 1 hora, dependendo do endpoint)

### Frontend (A Implementar):
- ⚠️ Tratamento de URLs expiradas necessário
- ⚠️ Renovação automática ou sob demanda
- ⚠️ Feedback visual quando URL expirar

## 🔍 Valores de Expiração por Endpoint

| Endpoint | Tempo de Expiração | Motivo |
|----------|-------------------|--------|
| Upload de anexos (chamados) | 7 dias | Máximo permitido |
| Upload de imagens | 7 dias | Máximo permitido |
| Listar imagens | 1 hora | Renovação frequente |
| Download de imagem | 1 hora | Renovação frequente |

## 💡 Recomendações

1. **Para anexos em chamados:** Renovar URLs ao abrir o chamado (já vem renovado na resposta)
2. **Para imagens:** Implementar renovação automática ou sob demanda
3. **Cache:** Considerar armazenar URLs localmente com timestamp
4. **UX:** Mostrar mensagem amigável quando URL expirar e permitir renovação manual

---

**Última atualização:** 30/12/2025
**Status:** ✅ Backend corrigido - Frontend precisa implementar tratamento de URLs expiradas

