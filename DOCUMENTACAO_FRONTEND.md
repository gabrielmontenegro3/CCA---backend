# 📚 Documentação da API - CCA Backend

## 🚀 Como Colocar em Funcionamento

### 1. Configuração Inicial

A API está rodando na porta **3000** por padrão. A URL base é:
```
http://localhost:3000/api
```

### 2. Iniciar o Servidor

No diretório do backend, execute:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

### 3. Testar a Conexão

Acesse `http://localhost:3000/health` para verificar se a API está funcionando.

---

## 🔌 Como Conectar o Front-end com a API

### Configuração Base

Crie um arquivo de configuração no seu front-end (ex: `src/config/api.ts`):

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

export default API_BASE_URL;
```

### Exemplo de Cliente HTTP (Axios)

```typescript
import axios from 'axios';
import API_BASE_URL from './config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### Exemplo de Cliente HTTP (Fetch)

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export default fetchAPI;
```

---

## 📋 Endpoints Disponíveis

### 1. PRODUTOS
**Base URL:** `/api/produtos`

#### Listar todos os produtos
```http
GET /api/produtos
```

**Resposta:**
```json
[
  {
    "id": 1,
    "nome_produto": "Ar Condicionado Split",
    "codigo_sku": "AC-001",
    "categoria": "Climatização",
    "unidade_medida": "unidade",
    "prazo_garantia_abnt_meses": 12,
    "prazo_garantia_fabrica_meses": 24,
    "frequencia_preventiva_meses": 6,
    "regras_manutencao": "Limpeza de filtros mensal",
    "manual_pdf_url": "https://..."
  }
]
```

#### Buscar produto por ID
```http
GET /api/produtos/:id
```

#### Criar produto
```http
POST /api/produtos
Content-Type: application/json

{
  "nome_produto": "Ar Condicionado Split",
  "codigo_sku": "AC-001",
  "categoria": "Climatização",
  "unidade_medida": "unidade",
  "prazo_garantia_abnt_meses": 12,
  "prazo_garantia_fabrica_meses": 24,
  "frequencia_preventiva_meses": 6,
  "regras_manutencao": "Limpeza de filtros mensal",
  "manual_pdf_url": "https://..."
}
```

#### Atualizar produto
```http
PUT /api/produtos/:id
Content-Type: application/json

{
  "nome_produto": "Ar Condicionado Split Atualizado"
}
```

#### Remover produto
```http
DELETE /api/produtos/:id
```

---

### 2. FORNECEDORES
**Base URL:** `/api/fornecedores`

#### Listar fornecedores
```http
GET /api/fornecedores
```

#### Buscar fornecedor por ID
```http
GET /api/fornecedores/:id
```

#### Criar fornecedor
```http
POST /api/fornecedores
Content-Type: application/json

{
  "nome": "Fornecedor XYZ",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 99999-9999",
  "email": "contato@fornecedor.com"
}
```

#### Atualizar fornecedor
```http
PUT /api/fornecedores/:id
```

#### Remover fornecedor
```http
DELETE /api/fornecedores/:id
```

---

### 3. CONTATOS
**Base URL:** `/api/contatos`

#### Listar contatos (com filtros opcionais)
```http
GET /api/contatos
GET /api/contatos?id_fornecedor=1
GET /api/contatos?id_empreendimento=1
GET /api/contatos?id_fornecedor=1&id_empreendimento=1
```

#### Criar contato
```http
POST /api/contatos
Content-Type: application/json

{
  "nome": "João Silva",
  "telefone": "(11) 99999-9999",
  "email": "joao@email.com",
  "tipo": "sindico",
  "id_fornecedor": 1,
  "id_empreendimento": 1
}
```

#### Atualizar contato
```http
PUT /api/contatos/:id
```

#### Remover contato
```http
DELETE /api/contatos/:id
```

---

### 4. EMPREENDIMENTOS
**Base URL:** `/api/empreendimentos`

#### Listar empreendimentos
```http
GET /api/empreendimentos
```

#### Buscar empreendimento por ID (com unidades e contato do síndico)
```http
GET /api/empreendimentos/:id
```

**Resposta:**
```json
{
  "id": 1,
  "nome": "Residencial Sol Nascente",
  "endereco": "Rua das Flores, 123",
  "data_entrega_chaves": "2024-01-15",
  "unidades": [
    {
      "id": 1,
      "numero": "101",
      "id_empreendimento": 1
    }
  ],
  "contato_sindico": {
    "id": 1,
    "nome": "João Silva",
    "telefone": "(11) 99999-9999"
  }
}
```

#### Criar empreendimento
```http
POST /api/empreendimentos
Content-Type: application/json

{
  "nome": "Residencial Sol Nascente",
  "endereco": "Rua das Flores, 123",
  "data_entrega_chaves": "2024-01-15"
}
```

#### Atualizar empreendimento
```http
PUT /api/empreendimentos/:id
```

---

### 5. UNIDADES
**Base URL:** `/api/unidades`

#### Listar unidades (com filtro opcional)
```http
GET /api/unidades
GET /api/unidades?id_empreendimento=1
```

#### Buscar unidade por ID
```http
GET /api/unidades/:id
```

#### Criar unidade
```http
POST /api/unidades
Content-Type: application/json

{
  "numero": "101",
  "id_empreendimento": 1,
  "data_instalacao": "2024-01-20"
}
```

#### Atualizar unidade
```http
PUT /api/unidades/:id
```

---

### 6. PRODUTOS DA UNIDADE / GARANTIAS
**Base URL:** `/api/unidades/:id/produtos`

#### Listar produtos da unidade (com cálculos de garantia)
```http
GET /api/unidades/:id/produtos
```

**Resposta:**
```json
[
  {
    "id": 1,
    "id_unidade": 1,
    "id_produto": 1,
    "data_instalacao": "2024-01-20",
    "Produto": {
      "id": 1,
      "nome_produto": "Ar Condicionado Split",
      "prazo_garantia_abnt_meses": 12,
      "prazo_garantia_fabrica_meses": 24
    },
    "data_base": "2024-01-20",
    "data_fim_garantia_abnt": "2025-01-20",
    "data_fim_garantia_fabrica": "2026-01-20",
    "status_garantia_abnt": "VALIDA",
    "status_garantia_fabrica": "VALIDA"
  }
]
```

**Lógica de data_base:**
- Se `data_instalacao` existir na unidade → usa `data_instalacao`
- Senão → usa `empreendimento.data_entrega_chaves`

**Status da garantia:**
- `VALIDA`: data atual <= data_fim
- `EXPIRADA`: data atual > data_fim

#### Adicionar produto à unidade
```http
POST /api/unidades/:id/produtos
Content-Type: application/json

{
  "id_produto": 1,
  "data_instalacao": "2024-01-20"
}
```

**Resposta:** Retorna o produto com os cálculos de garantia já aplicados.

---

### 7. CHAMADOS
**Base URL:** `/api/chamados`

#### Listar chamados (com filtros opcionais)
```http
GET /api/chamados
GET /api/chamados?id_unidade=1
GET /api/chamados?tipo_chamado=MANUTENCAO
GET /api/chamados?status=ABERTO
GET /api/chamados?id_unidade=1&status=ABERTO
```

#### Buscar chamado por ID
```http
GET /api/chamados/:id
```

#### Criar chamado (validação automática de garantia)
```http
POST /api/chamados
Content-Type: application/json

{
  "id_unidade": 1,
  "id_produto": 1,
  "tipo_chamado": "MANUTENCAO",
  "descricao": "Ar condicionado não está ligando",
  "status": "ABERTO"
}
```

**Validação automática:**
- O backend verifica automaticamente se o produto está dentro da garantia
- Preenche o campo `validacao_garantia` com:
  - `DENTRO_DA_GARANTIA`: se o produto está em garantia
  - `FORA_DA_GARANTIA`: se o produto não está em garantia

#### Atualizar chamado
```http
PUT /api/chamados/:id
Content-Type: application/json

{
  "descricao": "Descrição atualizada",
  "status": "EM_ANDAMENTO"
}
```

#### Atualizar apenas o status do chamado
```http
PATCH /api/chamados/:id/status
Content-Type: application/json

{
  "status": "FINALIZADO"
}
```

---

### 8. DASHBOARD / VISÃO GERAL
**Base URL:** `/api/dashboard`

#### Obter dados consolidados
```http
GET /api/dashboard
```

**Resposta:**
```json
{
  "total_unidades": 50,
  "total_garantias_validas": 120,
  "total_garantias_vencidas": 15,
  "garantias_vencendo_90_dias": 8,
  "total_chamados_abertos": 5,
  "total_chamados_finalizados": 45,
  "proximos_preventivos": [
    {
      "id_unidade": 1,
      "id_produto": 1,
      "unidade": "101",
      "produto": "Ar Condicionado Split",
      "data_proximo_preventivo": "2024-04-20",
      "frequencia_meses": 6
    }
  ]
}
```

**Descrição dos campos:**
- `total_unidades`: Total de unidades cadastradas
- `total_garantias_validas`: Total de garantias ainda válidas (ABNT + Fábrica)
- `total_garantias_vencidas`: Total de garantias expiradas
- `garantias_vencendo_90_dias`: Garantias que vencem nos próximos 90 dias
- `total_chamados_abertos`: Chamados com status "ABERTO"
- `total_chamados_finalizados`: Chamados com status "FINALIZADO"
- `proximos_preventivos`: Lista dos próximos 10 preventivos baseados em `frequencia_preventiva_meses`

---

## ⚠️ Tratamento de Erros

Todos os endpoints retornam erros no seguinte formato:

```json
{
  "error": "Mensagem de erro"
}
```

**Códigos de status HTTP:**
- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Erro de validação
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

---

## 📝 Exemplos de Uso

### Exemplo 1: Listar produtos e exibir no front-end

```typescript
import api from './config/api';

async function listarProdutos() {
  try {
    const response = await api.get('/produtos');
    return response.data;
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    throw error;
  }
}
```

### Exemplo 2: Criar um chamado

```typescript
async function criarChamado(dados: {
  id_unidade: number;
  id_produto: number;
  tipo_chamado: string;
  descricao: string;
}) {
  try {
    const response = await api.post('/chamados', dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar chamado:', error);
    throw error;
  }
}
```

### Exemplo 3: Buscar produtos de uma unidade com garantias

```typescript
async function buscarProdutosUnidade(idUnidade: number) {
  try {
    const response = await api.get(`/unidades/${idUnidade}/produtos`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos da unidade:', error);
    throw error;
  }
}
```

### Exemplo 4: Obter dados do dashboard

```typescript
async function obterDashboard() {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Erro ao obter dashboard:', error);
    throw error;
  }
}
```

---

## 🔑 Regras Importantes

1. **Cálculo de Garantias**: Sempre feito no backend. O front-end apenas exibe os dados calculados.

2. **Data Base para Garantias**: 
   - Prioridade 1: `data_instalacao` da unidade
   - Prioridade 2: `data_entrega_chaves` do empreendimento

3. **Validação de Garantia em Chamados**: Automática ao criar um chamado. O campo `validacao_garantia` é preenchido automaticamente.

4. **Status de Garantia**: 
   - `VALIDA`: Data atual <= data fim da garantia
   - `EXPIRADA`: Data atual > data fim da garantia

5. **Filtros**: Todos os filtros são opcionais e podem ser combinados usando query parameters.

---

## 🎯 Próximos Passos para o Front-end

1. **Configurar o cliente HTTP** (Axios ou Fetch)
2. **Criar serviços/helpers** para cada entidade
3. **Implementar tratamento de erros** global
4. **Criar hooks/contextos** para gerenciar estado (se usar React)
5. **Implementar loading states** durante as requisições
6. **Adicionar validação de formulários** no front-end (validação final sempre no backend)

---

## 📞 Suporte

Se encontrar algum problema ou tiver dúvidas sobre a API, verifique:
1. Se o servidor está rodando (`http://localhost:3000/health`)
2. Se a URL base está correta
3. Se os dados enviados estão no formato correto (JSON)
4. Se os IDs usados existem no banco de dados

---

**Última atualização:** Janeiro 2024




