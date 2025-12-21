# 📋 Documentação Completa: CRUDs - Novo Schema

## 🎯 Objetivo

Esta documentação detalha **EXATAMENTE** como usar cada endpoint CRUD, quais informações devem estar presentes em cada tela, e como implementar no front-end. **Este é um schema completamente novo** - todas as tabelas foram recriadas e os relacionamentos são diferentes.

---

## 📊 Estrutura de Dados e Relacionamentos

### Hierarquia de Dados:

```
FORNECEDORES (Tabela Base)
 ├── PRODUTOS (via fornecedor_id)
 │     ├── GARANTIAS (via produto_id)
 │     ├── PREVENTIVOS (via produto_id)
 │     └── PRODUTO_LOCAIS (tabela de relacionamento)
 │
 └── FORNECEDOR_PRODUTOS (tabela de relacionamento)

LOCAIS (Tabela Base)
 ├── GARANTIAS (via local_id)
 ├── PREVENTIVOS (via local_id)
 └── PRODUTO_LOCAIS (tabela de relacionamento)

PRODUTOS (Tabela Base)
 ├── GARANTIAS (via produto_id)
 ├── PREVENTIVOS (via produto_id)
 ├── PRODUTO_LOCAIS (tabela de relacionamento)
 └── FORNECEDOR_PRODUTOS (tabela de relacionamento)

GARANTIAS
 ├── SISTEMA_GARANTIAS (tabela de relacionamento com SISTEMAS_EDIFICACAO)
 └── Relaciona: produto, local, fornecedor

PREVENTIVOS
 └── PREVENTIVO_ARQUIVOS (via preventivo_id)

SISTEMAS_EDIFICACAO
 └── SISTEMA_GARANTIAS (tabela de relacionamento com GARANTIAS)

MANUTENCOES_PREVENTIVAS
 └── Relaciona: local, produto
```

---

## 🔌 Endpoints Disponíveis

### Base URL: `http://localhost:3000/api`

---

## 1. FORNECEDORES

### Endpoints:
- **GET** `/api/fornecedores-novo` - Listar todos os fornecedores
- **GET** `/api/fornecedores-novo/:id` - Buscar fornecedor por ID
- **POST** `/api/fornecedores-novo` - Criar fornecedor
- **PUT** `/api/fornecedores-novo/:id` - Atualizar fornecedor
- **DELETE** `/api/fornecedores-novo/:id` - Remover fornecedor

### Query Parameters (GET):
- Nenhum

### Interface TypeScript:
```typescript
interface Fornecedor {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  complemento?: string;
  ponto_referencia?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}
```

### Campos Obrigatórios (POST):
- `nome` (string) - **OBRIGATÓRIO**

### Campos Opcionais (POST/PUT):
- `email` (string)
- `telefone` (string)
- `endereco` (string)
- `complemento` (string)
- `ponto_referencia` (string)
- `cidade` (string)
- `estado` (string)
- `cep` (string)

### Exemplo de Request POST:
```json
{
  "nome": "Fornecedor XYZ",
  "email": "contato@xyz.com",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Exemplo, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01234-567"
}
```

### Exemplo de Response GET:
```json
[
  {
    "id": 1,
    "nome": "Fornecedor XYZ",
    "email": "contato@xyz.com",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua Exemplo, 123",
    "complemento": null,
    "ponto_referencia": null,
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  }
]
```

---

## 2. LOCAIS

### Endpoints:
- **GET** `/api/locais` - Listar todos os locais
- **GET** `/api/locais/:id` - Buscar local por ID
- **POST** `/api/locais` - Criar local
- **PUT** `/api/locais/:id` - Atualizar local
- **DELETE** `/api/locais/:id` - Remover local

### Query Parameters (GET):
- Nenhum

### Interface TypeScript:
```typescript
interface Local {
  id: number;
  nome: string;
  plano_preventivo?: string; // mensal, 3 meses, 6 meses, anual etc
}
```

### Campos Obrigatórios (POST):
- `nome` (string) - **OBRIGATÓRIO**

### Campos Opcionais (POST/PUT):
- `plano_preventivo` (string) - Ex: "mensal", "3 meses", "6 meses", "anual"

### Exemplo de Request POST:
```json
{
  "nome": "Apartamento 101",
  "plano_preventivo": "mensal"
}
```

---

## 3. PRODUTOS

### Endpoints:
- **GET** `/api/produtos-novo` - Listar todos os produtos (com fornecedor e locais)
- **GET** `/api/produtos-novo/:id` - Buscar produto por ID (com dados relacionados)
- **POST** `/api/produtos-novo` - Criar produto
- **PUT** `/api/produtos-novo/:id` - Atualizar produto
- **DELETE** `/api/produtos-novo/:id` - Remover produto

### Query Parameters (GET):
- `fornecedor_id` - Filtrar por fornecedor

### Interface TypeScript:
```typescript
interface Produto {
  id: number;
  fornecedor_id?: number;
  nome: string;
  especificacao_tecnica?: string;
  fornecedor?: Fornecedor | null;
  locais?: Local[];
}
```

### Campos Obrigatórios (POST):
- `nome` (string) - **OBRIGATÓRIO**

### Campos Opcionais (POST/PUT):
- `fornecedor_id` (number) - ID do fornecedor (deve existir na tabela fornecedores)
- `especificacao_tecnica` (string)
- `locais_ids` (number[]) - Array de IDs de locais para associar (cria registros em produto_locais)

### ⚠️ IMPORTANTE - Relacionamentos:
- Ao criar um produto, você pode fornecer `fornecedor_id` diretamente
- Você também pode fornecer `locais_ids` (array) para associar o produto a múltiplos locais
- O endpoint retorna o produto com `fornecedor` e `locais` já populados

### Exemplo de Request POST:
```json
{
  "nome": "Ar Condicionado Split",
  "fornecedor_id": 1,
  "especificacao_tecnica": "12.000 BTUs, Inverter",
  "locais_ids": [1, 2, 3]
}
```

### Exemplo de Response GET `/api/produtos-novo/:id`:
```json
{
  "id": 1,
  "fornecedor_id": 1,
  "nome": "Ar Condicionado Split",
  "especificacao_tecnica": "12.000 BTUs, Inverter",
  "fornecedor": {
    "id": 1,
    "nome": "Fornecedor XYZ",
    "email": "contato@xyz.com"
  },
  "locais": [
    {
      "id": 1,
      "nome": "Apartamento 101",
      "plano_preventivo": "mensal"
    },
    {
      "id": 2,
      "nome": "Apartamento 102",
      "plano_preventivo": "3 meses"
    }
  ]
}
```

### 🎨 Front-end - Criar Produto:
```typescript
// 1. Buscar fornecedores para o select
const fornecedores = await fetch('http://localhost:3000/api/fornecedores-novo')
  .then(res => res.json());

// 2. Buscar locais para o select múltiplo
const locais = await fetch('http://localhost:3000/api/locais')
  .then(res => res.json());

// 3. Criar produto
const novoProduto = {
  nome: "Ar Condicionado Split",
  fornecedor_id: 1, // Selecionado do dropdown
  especificacao_tecnica: "12.000 BTUs",
  locais_ids: [1, 2, 3] // Selecionados do select múltiplo
};

await fetch('http://localhost:3000/api/produtos-novo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoProduto)
});
```

---

## 4. GARANTIAS

### Endpoints:
- **GET** `/api/garantias-novo` - Listar todas as garantias (com produto, local, fornecedor)
- **GET** `/api/garantias-novo/:id` - Buscar garantia por ID
- **POST** `/api/garantias-novo` - Criar garantia
- **PUT** `/api/garantias-novo/:id` - Atualizar garantia
- **DELETE** `/api/garantias-novo/:id` - Remover garantia

### Query Parameters (GET):
- `produto_id` - Filtrar por produto
- `local_id` - Filtrar por local
- `fornecedor_id` - Filtrar por fornecedor

### Interface TypeScript:
```typescript
interface Garantia {
  id: number;
  produto_id?: number;
  local_id?: number;
  fornecedor_id?: number;
  duracao?: string;
  cobertura?: string;
  documentos?: string;
  descricao?: string;
  perda_garantia?: string;
  data_compra?: string; // YYYY-MM-DD
  data_expiracao?: string; // YYYY-MM-DD
  produto?: Produto | null;
  local?: Local | null;
  fornecedor?: Fornecedor | null;
}
```

### Campos Obrigatórios (POST):
- Nenhum (todos são opcionais, mas recomendado ter pelo menos produto_id ou local_id)

### Campos Opcionais (POST/PUT):
- `produto_id` (number) - Deve existir na tabela produtos
- `local_id` (number) - Deve existir na tabela locais
- `fornecedor_id` (number) - Deve existir na tabela fornecedores
- `duracao` (string) - Ex: "12 meses", "2 anos"
- `cobertura` (string)
- `documentos` (string)
- `descricao` (string)
- `perda_garantia` (string)
- `data_compra` (string) - Formato: YYYY-MM-DD
- `data_expiracao` (string) - Formato: YYYY-MM-DD

### Exemplo de Request POST:
```json
{
  "produto_id": 1,
  "local_id": 1,
  "fornecedor_id": 1,
  "duracao": "12 meses",
  "cobertura": "Defeitos de fabricação",
  "data_compra": "2024-01-15",
  "data_expiracao": "2025-01-15",
  "descricao": "Garantia do fabricante"
}
```

### Exemplo de Response GET:
```json
[
  {
    "id": 1,
    "produto_id": 1,
    "local_id": 1,
    "fornecedor_id": 1,
    "duracao": "12 meses",
    "cobertura": "Defeitos de fabricação",
    "data_compra": "2024-01-15",
    "data_expiracao": "2025-01-15",
    "produto": {
      "id": 1,
      "nome": "Ar Condicionado Split"
    },
    "local": {
      "id": 1,
      "nome": "Apartamento 101"
    },
    "fornecedor": {
      "id": 1,
      "nome": "Fornecedor XYZ"
    }
  }
]
```

### 🎨 Front-end - Criar Garantia:
```typescript
// 1. Buscar produtos para o select
const produtos = await fetch('http://localhost:3000/api/produtos-novo')
  .then(res => res.json());

// 2. Buscar locais para o select
const locais = await fetch('http://localhost:3000/api/locais')
  .then(res => res.json());

// 3. Buscar fornecedores para o select
const fornecedores = await fetch('http://localhost:3000/api/fornecedores-novo')
  .then(res => res.json());

// 4. Criar garantia
const novaGarantia = {
  produto_id: 1, // Selecionado do dropdown
  local_id: 1, // Selecionado do dropdown
  fornecedor_id: 1, // Selecionado do dropdown
  duracao: "12 meses",
  data_compra: "2024-01-15",
  data_expiracao: "2025-01-15"
};

await fetch('http://localhost:3000/api/garantias-novo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novaGarantia)
});
```

---

## 5. PREVENTIVOS

### Endpoints:
- **GET** `/api/preventivos` - Listar todos os preventivos (com produto, local, arquivos)
- **GET** `/api/preventivos/:id` - Buscar preventivo por ID
- **POST** `/api/preventivos` - Criar preventivo
- **PUT** `/api/preventivos/:id` - Atualizar preventivo
- **DELETE** `/api/preventivos/:id` - Remover preventivo

### Query Parameters (GET):
- `produto_id` - Filtrar por produto
- `local_id` - Filtrar por local
- `status` - Filtrar por status

### Interface TypeScript:
```typescript
interface Preventivo {
  id: number;
  produto_id?: number;
  local_id?: number;
  data_preventiva?: string; // YYYY-MM-DD
  periodicidade?: string; // mensal, 3 meses, 6 meses, anual etc
  status?: string;
  empresa_responsavel?: string;
  tecnico_responsavel?: string;
  custo?: number;
  anotacoes?: string;
  exigencia?: string; // obrigatorio / recomendado
  produto?: Produto | null;
  local?: Local | null;
  arquivos?: PreventivoArquivo[];
}
```

### Campos Obrigatórios (POST):
- Nenhum (todos são opcionais)

### Campos Opcionais (POST/PUT):
- `produto_id` (number) - Deve existir na tabela produtos
- `local_id` (number) - Deve existir na tabela locais
- `data_preventiva` (string) - Formato: YYYY-MM-DD
- `periodicidade` (string) - Ex: "mensal", "3 meses", "6 meses", "anual"
- `status` (string)
- `empresa_responsavel` (string)
- `tecnico_responsavel` (string)
- `custo` (number) - Decimal
- `anotacoes` (string)
- `exigencia` (string) - "obrigatorio" ou "recomendado"

### Exemplo de Request POST:
```json
{
  "produto_id": 1,
  "local_id": 1,
  "data_preventiva": "2025-01-15",
  "periodicidade": "mensal",
  "status": "pendente",
  "empresa_responsavel": "Empresa XYZ",
  "tecnico_responsavel": "João Silva",
  "custo": 150.00,
  "exigencia": "obrigatorio"
}
```

### Exemplo de Response GET `/api/preventivos/:id`:
```json
{
  "id": 1,
  "produto_id": 1,
  "local_id": 1,
  "data_preventiva": "2025-01-15",
  "periodicidade": "mensal",
  "status": "pendente",
  "exigencia": "obrigatorio",
  "produto": {
    "id": 1,
    "nome": "Ar Condicionado Split"
  },
  "local": {
    "id": 1,
    "nome": "Apartamento 101"
  },
  "arquivos": [
    {
      "id": 1,
      "preventivo_id": 1,
      "tipo": "ART",
      "arquivo": "https://..."
    }
  ]
}
```

---

## 6. PREVENTIVO ARQUIVOS

### Endpoints:
- **GET** `/api/preventivo-arquivos` - Listar todos os arquivos
- **GET** `/api/preventivo-arquivos/:id` - Buscar arquivo por ID
- **POST** `/api/preventivo-arquivos` - Criar arquivo
- **PUT** `/api/preventivo-arquivos/:id` - Atualizar arquivo
- **DELETE** `/api/preventivo-arquivos/:id` - Remover arquivo

### Query Parameters (GET):
- `preventivo_id` - Filtrar por preventivo
- `tipo` - Filtrar por tipo (ART, Nota fiscal, Foto, Outro)

### Interface TypeScript:
```typescript
interface PreventivoArquivo {
  id: number;
  preventivo_id: number;
  tipo: string; // ART, Nota fiscal, Foto, Outro
  arquivo: string; // URL ou texto do arquivo
}
```

### Campos Obrigatórios (POST):
- `preventivo_id` (number) - **OBRIGATÓRIO** - Deve existir na tabela preventivos
- `tipo` (string) - **OBRIGATÓRIO**
- `arquivo` (string) - **OBRIGATÓRIO** - URL do arquivo ou texto

### Exemplo de Request POST:
```json
{
  "preventivo_id": 1,
  "tipo": "ART",
  "arquivo": "https://storage.supabase.co/..."
}
```

### 🎨 Front-end - Upload de Arquivo:
```typescript
// 1. Upload do arquivo para Supabase Storage (ou outro serviço)
// 2. Obter URL do arquivo
// 3. Criar registro do arquivo
const novoArquivo = {
  preventivo_id: 1,
  tipo: "ART", // ou "Nota fiscal", "Foto", "Outro"
  arquivo: urlDoArquivo // URL retornada do upload
};

await fetch('http://localhost:3000/api/preventivo-arquivos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoArquivo)
});
```

---

## 7. SISTEMAS DE EDIFICAÇÃO

### Endpoints:
- **GET** `/api/sistemas-edificacao` - Listar todos os sistemas (com garantias relacionadas)
- **GET** `/api/sistemas-edificacao/:id` - Buscar sistema por ID
- **POST** `/api/sistemas-edificacao` - Criar sistema
- **PUT** `/api/sistemas-edificacao/:id` - Atualizar sistema
- **DELETE** `/api/sistemas-edificacao/:id` - Remover sistema

### Query Parameters (GET):
- `exigencia` - Filtrar por exigencia (obrigatoria / recomendada)

### Interface TypeScript:
```typescript
interface SistemaEdificacao {
  id: number;
  titulo: string;
  norma?: string;
  exigencia?: string; // obrigatoria / recomendada
  cuidados_uso?: string;
  garantias?: Garantia[];
}
```

### Campos Obrigatórios (POST):
- `titulo` (string) - **OBRIGATÓRIO**

### Campos Opcionais (POST/PUT):
- `norma` (string) - Ex: "NBR 5674"
- `exigencia` (string) - "obrigatoria" ou "recomendada"
- `cuidados_uso` (string)
- `garantias_ids` (number[]) - Array de IDs de garantias para associar (cria registros em sistema_garantias)

### ⚠️ IMPORTANTE - Relacionamento com Garantias:
- Ao criar/atualizar um sistema, você pode fornecer `garantias_ids` (array)
- Isso cria registros na tabela `sistema_garantias` (relacionamento N:N)
- O endpoint retorna o sistema com `garantias` já populadas

### Exemplo de Request POST:
```json
{
  "titulo": "Drywall",
  "norma": "NBR 5674",
  "exigencia": "obrigatoria",
  "cuidados_uso": "Manter ambiente ventilado...",
  "garantias_ids": [1, 2, 3]
}
```

### Exemplo de Response GET `/api/sistemas-edificacao/:id`:
```json
{
  "id": 1,
  "titulo": "Drywall",
  "norma": "NBR 5674",
  "exigencia": "obrigatoria",
  "cuidados_uso": "Manter ambiente ventilado...",
  "garantias": [
    {
      "id": 1,
      "duracao": "5 anos",
      "cobertura": "Aderência"
    },
    {
      "id": 2,
      "duracao": "3 anos",
      "cobertura": "Estanqueidade"
    }
  ]
}
```

### 🎨 Front-end - Criar Sistema com Garantias:
```typescript
// 1. Buscar garantias disponíveis para o select múltiplo
const garantias = await fetch('http://localhost:3000/api/garantias-novo')
  .then(res => res.json());

// 2. Criar sistema
const novoSistema = {
  titulo: "Drywall",
  norma: "NBR 5674",
  exigencia: "obrigatoria",
  cuidados_uso: "Manter ambiente ventilado...",
  garantias_ids: [1, 2, 3] // IDs selecionados do select múltiplo
};

await fetch('http://localhost:3000/api/sistemas-edificacao', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoSistema)
});
```

---

## 8. MANUTENÇÕES PREVENTIVAS

### Endpoints:
- **GET** `/api/manutencoes-preventivas-novo` - Listar todas as manutenções (com local e produto)
- **GET** `/api/manutencoes-preventivas-novo/:id` - Buscar manutenção por ID
- **POST** `/api/manutencoes-preventivas-novo` - Criar manutenção
- **PUT** `/api/manutencoes-preventivas-novo/:id` - Atualizar manutenção
- **DELETE** `/api/manutencoes-preventivas-novo/:id` - Remover manutenção

### Query Parameters (GET):
- `local_id` - Filtrar por local
- `produto_id` - Filtrar por produto

### Interface TypeScript:
```typescript
interface ManutencaoPreventiva {
  id: number;
  local_id?: number;
  produto_id?: number;
  sistema_construtivo?: string;
  arquivos?: string; // Texto ou JSON com URLs
  local?: Local | null;
  produto?: Produto | null;
}
```

### Campos Obrigatórios (POST):
- Nenhum (todos são opcionais)

### Campos Opcionais (POST/PUT):
- `local_id` (number) - Deve existir na tabela locais
- `produto_id` (number) - Deve existir na tabela produtos
- `sistema_construtivo` (string)
- `arquivos` (string) - Texto ou JSON com URLs dos arquivos

### Exemplo de Request POST:
```json
{
  "local_id": 1,
  "produto_id": 1,
  "sistema_construtivo": "Drywall",
  "arquivos": "https://storage.supabase.co/arquivo1.pdf,https://storage.supabase.co/arquivo2.jpg"
}
```

---

## 9. FORNECEDOR-PRODUTOS (Tabela de Relacionamento)

### Endpoints:
- **GET** `/api/fornecedor-produtos` - Listar todas as associações (com fornecedor e produto)
- **POST** `/api/fornecedor-produtos` - Criar associação
- **PUT** `/api/fornecedor-produtos/:fornecedor_id/:produto_id` - Atualizar associação
- **DELETE** `/api/fornecedor-produtos/:fornecedor_id/:produto_id` - Remover associação

### Query Parameters (GET):
- `fornecedor_id` - Filtrar por fornecedor
- `produto_id` - Filtrar por produto

### Interface TypeScript:
```typescript
interface FornecedorProduto {
  fornecedor_id: number;
  produto_id: number;
  especificacao_tecnica?: string;
  fornecedor?: Fornecedor | null;
  produto?: Produto | null;
}
```

### Campos Obrigatórios (POST):
- `fornecedor_id` (number) - **OBRIGATÓRIO**
- `produto_id` (number) - **OBRIGATÓRIO**

### Campos Opcionais (POST/PUT):
- `especificacao_tecnica` (string)

### Exemplo de Request POST:
```json
{
  "fornecedor_id": 1,
  "produto_id": 1,
  "especificacao_tecnica": "Especificação técnica específica deste fornecedor para este produto"
}
```

### ⚠️ IMPORTANTE:
- Esta é uma tabela de relacionamento N:N entre fornecedores e produtos
- Permite que um produto tenha múltiplos fornecedores com especificações diferentes
- Use quando precisar associar um produto a um fornecedor com uma especificação técnica específica

---

## 📝 Resumo dos CRUDs e Relacionamentos

### 1. CRUD de Fornecedores
- **Listar:** GET `/api/fornecedores-novo`
- **Criar:** POST `/api/fornecedores-novo` (campo obrigatório: `nome`)
- **Visualizar:** GET `/api/fornecedores-novo/:id`
- **Editar:** PUT `/api/fornecedores-novo/:id`
- **Excluir:** DELETE `/api/fornecedores-novo/:id`
- **Uso no Front-end:** Select/dropdown para escolher fornecedor ao criar produto ou garantia

### 2. CRUD de Locais
- **Listar:** GET `/api/locais`
- **Criar:** POST `/api/locais` (campo obrigatório: `nome`)
- **Visualizar:** GET `/api/locais/:id`
- **Editar:** PUT `/api/locais/:id`
- **Excluir:** DELETE `/api/locais/:id`
- **Uso no Front-end:** Select/dropdown para escolher local ao criar produto, garantia ou preventivo

### 3. CRUD de Produtos
- **Listar:** GET `/api/produtos-novo` (retorna com fornecedor e locais)
- **Criar:** POST `/api/produtos-novo` (campo obrigatório: `nome`, opcional: `fornecedor_id`, `locais_ids[]`)
- **Visualizar:** GET `/api/produtos-novo/:id` (retorna com fornecedor e locais)
- **Editar:** PUT `/api/produtos-novo/:id` (pode atualizar `locais_ids[]` para re-associar locais)
- **Excluir:** DELETE `/api/produtos-novo/:id`
- **Uso no Front-end:**
  - Select de fornecedores ao criar produto
  - Select múltiplo de locais ao criar produto
  - Select de produtos ao criar garantia ou preventivo

### 4. CRUD de Garantias
- **Listar:** GET `/api/garantias-novo` (retorna com produto, local, fornecedor)
- **Criar:** POST `/api/garantias-novo` (todos opcionais, mas recomendado ter produto_id ou local_id)
- **Visualizar:** GET `/api/garantias-novo/:id` (retorna com produto, local, fornecedor)
- **Editar:** PUT `/api/garantias-novo/:id`
- **Excluir:** DELETE `/api/garantias-novo/:id`
- **Uso no Front-end:**
  - Selects de produto, local e fornecedor ao criar garantia
  - Date pickers para `data_compra` e `data_expiracao`

### 5. CRUD de Preventivos
- **Listar:** GET `/api/preventivos` (retorna com produto, local, arquivos)
- **Criar:** POST `/api/preventivos` (todos opcionais)
- **Visualizar:** GET `/api/preventivos/:id` (retorna com produto, local, arquivos)
- **Editar:** PUT `/api/preventivos/:id`
- **Excluir:** DELETE `/api/preventivos/:id`
- **Uso no Front-end:**
  - Selects de produto e local ao criar preventivo
  - Select de `exigencia` (obrigatorio/recomendado)
  - Select de `periodicidade` (mensal, 3 meses, etc)
  - Campo de `custo` (número decimal)
  - Upload de arquivos via `/api/preventivo-arquivos`

### 6. CRUD de Arquivos de Preventivo
- **Listar:** GET `/api/preventivo-arquivos?preventivo_id=:id`
- **Criar:** POST `/api/preventivo-arquivos` (obrigatório: `preventivo_id`, `tipo`, `arquivo`)
- **Visualizar:** GET `/api/preventivo-arquivos/:id`
- **Editar:** PUT `/api/preventivo-arquivos/:id`
- **Excluir:** DELETE `/api/preventivo-arquivos/:id`
- **Uso no Front-end:**
  - Upload de arquivo para storage
  - Criar registro com URL do arquivo
  - Filtrar por tipo (ART, Nota fiscal, Foto, Outro)

### 7. CRUD de Sistemas de Edificação
- **Listar:** GET `/api/sistemas-edificacao` (retorna com garantias relacionadas)
- **Criar:** POST `/api/sistemas-edificacao` (obrigatório: `titulo`, opcional: `garantias_ids[]`)
- **Visualizar:** GET `/api/sistemas-edificacao/:id` (retorna com garantias relacionadas)
- **Editar:** PUT `/api/sistemas-edificacao/:id` (pode atualizar `garantias_ids[]`)
- **Excluir:** DELETE `/api/sistemas-edificacao/:id`
- **Uso no Front-end:**
  - Select múltiplo de garantias ao criar/editar sistema
  - Select de `exigencia` (obrigatoria/recomendada)

### 8. CRUD de Manutenções Preventivas
- **Listar:** GET `/api/manutencoes-preventivas-novo` (retorna com local e produto)
- **Criar:** POST `/api/manutencoes-preventivas-novo` (todos opcionais)
- **Visualizar:** GET `/api/manutencoes-preventivas-novo/:id` (retorna com local e produto)
- **Editar:** PUT `/api/manutencoes-preventivas-novo/:id`
- **Excluir:** DELETE `/api/manutencoes-preventivas-novo/:id`
- **Uso no Front-end:**
  - Selects de local e produto ao criar manutenção

### 9. CRUD de Fornecedor-Produtos (Relacionamento)
- **Listar:** GET `/api/fornecedor-produtos` (retorna com fornecedor e produto)
- **Criar:** POST `/api/fornecedor-produtos` (obrigatório: `fornecedor_id`, `produto_id`)
- **Visualizar:** Não há endpoint específico, use GET com filtros
- **Editar:** PUT `/api/fornecedor-produtos/:fornecedor_id/:produto_id`
- **Excluir:** DELETE `/api/fornecedor-produtos/:fornecedor_id/:produto_id`
- **Uso no Front-end:**
  - Para associar um produto a um fornecedor com especificação técnica específica
  - Útil quando um produto pode ter múltiplos fornecedores com especificações diferentes

---

## 🎨 Exemplos de Implementação Front-end

### Service Layer Completo

**Arquivo:** `src/services/apiService.ts`

```typescript
const API_BASE_URL = 'http://localhost:3000/api';

// Fornecedores Service
export const fornecedorService = {
  listar: async (): Promise<Fornecedor[]> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores-novo`);
    if (!response.ok) throw new Error('Erro ao listar fornecedores');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Fornecedor> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores-novo/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar fornecedor');
    return response.json();
  },

  criar: async (dados: Partial<Fornecedor>): Promise<Fornecedor> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores-novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar fornecedor');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: Partial<Fornecedor>): Promise<Fornecedor> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores-novo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar fornecedor');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/fornecedores-novo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover fornecedor');
  }
};

// Locais Service
export const localService = {
  listar: async (): Promise<Local[]> => {
    const response = await fetch(`${API_BASE_URL}/locais`);
    if (!response.ok) throw new Error('Erro ao listar locais');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Local> => {
    const response = await fetch(`${API_BASE_URL}/locais/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar local');
    return response.json();
  },

  criar: async (dados: Partial<Local>): Promise<Local> => {
    const response = await fetch(`${API_BASE_URL}/locais`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar local');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: Partial<Local>): Promise<Local> => {
    const response = await fetch(`${API_BASE_URL}/locais/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar local');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/locais/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover local');
  }
};

// Produtos Service
export const produtoService = {
  listar: async (filtros?: { fornecedor_id?: number }): Promise<Produto[]> => {
    const params = new URLSearchParams();
    if (filtros?.fornecedor_id) params.append('fornecedor_id', filtros.fornecedor_id.toString());

    const url = `${API_BASE_URL}/produtos-novo${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar produtos');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos-novo/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar produto');
    return response.json();
  },

  criar: async (dados: {
    nome: string;
    fornecedor_id?: number;
    especificacao_tecnica?: string;
    locais_ids?: number[];
  }): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos-novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar produto');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: {
    nome?: string;
    fornecedor_id?: number;
    especificacao_tecnica?: string;
    locais_ids?: number[];
  }): Promise<Produto> => {
    const response = await fetch(`${API_BASE_URL}/produtos-novo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/produtos-novo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover produto');
  }
};

// Garantias Service
export const garantiaService = {
  listar: async (filtros?: {
    produto_id?: number;
    local_id?: number;
    fornecedor_id?: number;
  }): Promise<Garantia[]> => {
    const params = new URLSearchParams();
    if (filtros?.produto_id) params.append('produto_id', filtros.produto_id.toString());
    if (filtros?.local_id) params.append('local_id', filtros.local_id.toString());
    if (filtros?.fornecedor_id) params.append('fornecedor_id', filtros.fornecedor_id.toString());

    const url = `${API_BASE_URL}/garantias-novo${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar garantias');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Garantia> => {
    const response = await fetch(`${API_BASE_URL}/garantias-novo/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar garantia');
    return response.json();
  },

  criar: async (dados: Partial<Garantia>): Promise<Garantia> => {
    const response = await fetch(`${API_BASE_URL}/garantias-novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar garantia');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: Partial<Garantia>): Promise<Garantia> => {
    const response = await fetch(`${API_BASE_URL}/garantias-novo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar garantia');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/garantias-novo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover garantia');
  }
};

// Preventivos Service
export const preventivoService = {
  listar: async (filtros?: {
    produto_id?: number;
    local_id?: number;
    status?: string;
  }): Promise<Preventivo[]> => {
    const params = new URLSearchParams();
    if (filtros?.produto_id) params.append('produto_id', filtros.produto_id.toString());
    if (filtros?.local_id) params.append('local_id', filtros.local_id.toString());
    if (filtros?.status) params.append('status', filtros.status);

    const url = `${API_BASE_URL}/preventivos${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar preventivos');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<Preventivo> => {
    const response = await fetch(`${API_BASE_URL}/preventivos/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar preventivo');
    return response.json();
  },

  criar: async (dados: Partial<Preventivo>): Promise<Preventivo> => {
    const response = await fetch(`${API_BASE_URL}/preventivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar preventivo');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: Partial<Preventivo>): Promise<Preventivo> => {
    const response = await fetch(`${API_BASE_URL}/preventivos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar preventivo');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/preventivos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover preventivo');
  }
};

// Preventivo Arquivos Service
export const preventivoArquivoService = {
  listar: async (filtros?: {
    preventivo_id?: number;
    tipo?: string;
  }): Promise<PreventivoArquivo[]> => {
    const params = new URLSearchParams();
    if (filtros?.preventivo_id) params.append('preventivo_id', filtros.preventivo_id.toString());
    if (filtros?.tipo) params.append('tipo', filtros.tipo);

    const url = `${API_BASE_URL}/preventivo-arquivos${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar arquivos');
    return response.json();
  },

  criar: async (dados: {
    preventivo_id: number;
    tipo: string;
    arquivo: string;
  }): Promise<PreventivoArquivo> => {
    const response = await fetch(`${API_BASE_URL}/preventivo-arquivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar arquivo');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/preventivo-arquivos/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover arquivo');
  }
};

// Sistemas de Edificação Service
export const sistemaEdificacaoService = {
  listar: async (filtros?: { exigencia?: string }): Promise<SistemaEdificacao[]> => {
    const params = new URLSearchParams();
    if (filtros?.exigencia) params.append('exigencia', filtros.exigencia);

    const url = `${API_BASE_URL}/sistemas-edificacao${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar sistemas');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<SistemaEdificacao> => {
    const response = await fetch(`${API_BASE_URL}/sistemas-edificacao/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar sistema');
    return response.json();
  },

  criar: async (dados: {
    titulo: string;
    norma?: string;
    exigencia?: string;
    cuidados_uso?: string;
    garantias_ids?: number[];
  }): Promise<SistemaEdificacao> => {
    const response = await fetch(`${API_BASE_URL}/sistemas-edificacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar sistema');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: {
    titulo?: string;
    norma?: string;
    exigencia?: string;
    cuidados_uso?: string;
    garantias_ids?: number[];
  }): Promise<SistemaEdificacao> => {
    const response = await fetch(`${API_BASE_URL}/sistemas-edificacao/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar sistema');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sistemas-edificacao/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover sistema');
  }
};

// Manutenções Preventivas Service
export const manutencaoPreventivaService = {
  listar: async (filtros?: {
    local_id?: number;
    produto_id?: number;
  }): Promise<ManutencaoPreventiva[]> => {
    const params = new URLSearchParams();
    if (filtros?.local_id) params.append('local_id', filtros.local_id.toString());
    if (filtros?.produto_id) params.append('produto_id', filtros.produto_id.toString());

    const url = `${API_BASE_URL}/manutencoes-preventivas-novo${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar manutenções');
    return response.json();
  },

  buscarPorId: async (id: number): Promise<ManutencaoPreventiva> => {
    const response = await fetch(`${API_BASE_URL}/manutencoes-preventivas-novo/${id}`);
    if (!response.ok) throw new Error('Erro ao buscar manutenção');
    return response.json();
  },

  criar: async (dados: Partial<ManutencaoPreventiva>): Promise<ManutencaoPreventiva> => {
    const response = await fetch(`${API_BASE_URL}/manutencoes-preventivas-novo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar manutenção');
    }
    return response.json();
  },

  atualizar: async (id: number, dados: Partial<ManutencaoPreventiva>): Promise<ManutencaoPreventiva> => {
    const response = await fetch(`${API_BASE_URL}/manutencoes-preventivas-novo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar manutenção');
    }
    return response.json();
  },

  remover: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/manutencoes-preventivas-novo/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover manutenção');
  }
};

// Fornecedor-Produtos Service
export const fornecedorProdutoService = {
  listar: async (filtros?: {
    fornecedor_id?: number;
    produto_id?: number;
  }): Promise<FornecedorProduto[]> => {
    const params = new URLSearchParams();
    if (filtros?.fornecedor_id) params.append('fornecedor_id', filtros.fornecedor_id.toString());
    if (filtros?.produto_id) params.append('produto_id', filtros.produto_id.toString());

    const url = `${API_BASE_URL}/fornecedor-produtos${params.toString() ? `?${params}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar associações');
    return response.json();
  },

  criar: async (dados: {
    fornecedor_id: number;
    produto_id: number;
    especificacao_tecnica?: string;
  }): Promise<FornecedorProduto> => {
    const response = await fetch(`${API_BASE_URL}/fornecedor-produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar associação');
    }
    return response.json();
  },

  atualizar: async (fornecedor_id: number, produto_id: number, especificacao_tecnica: string): Promise<FornecedorProduto> => {
    const response = await fetch(`${API_BASE_URL}/fornecedor-produtos/${fornecedor_id}/${produto_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ especificacao_tecnica })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar associação');
    }
    return response.json();
  },

  remover: async (fornecedor_id: number, produto_id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/fornecedor-produtos/${fornecedor_id}/${produto_id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Erro ao remover associação');
  }
};
```

---

## 🎨 Exemplo de Componente React - Criar Produto

```typescript
import React, { useState, useEffect } from 'react';
import { fornecedorService, localService, produtoService } from '../services/apiService';

const CriarProdutoPage: React.FC = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    fornecedor_id: null as number | null,
    especificacao_tecnica: '',
    locais_ids: [] as number[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [fornecedoresData, locaisData] = await Promise.all([
        fornecedorService.listar(),
        localService.listar()
      ]);
      setFornecedores(fornecedoresData);
      setLocais(locaisData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await produtoService.criar({
        nome: formData.nome,
        fornecedor_id: formData.fornecedor_id || undefined,
        especificacao_tecnica: formData.especificacao_tecnica || undefined,
        locais_ids: formData.locais_ids.length > 0 ? formData.locais_ids : undefined
      });
      alert('Produto criado com sucesso!');
      // Limpar formulário ou navegar
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLocaisChange = (localId: number) => {
    setFormData(prev => {
      const locaisIds = prev.locais_ids.includes(localId)
        ? prev.locais_ids.filter(id => id !== localId)
        : [...prev.locais_ids, localId];
      return { ...prev, locais_ids: locaisIds };
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nome do Produto *</label>
        <input
          type="text"
          value={formData.nome}
          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Fornecedor</label>
        <select
          value={formData.fornecedor_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            fornecedor_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um fornecedor</option>
          {fornecedores.map(fornecedor => (
            <option key={fornecedor.id} value={fornecedor.id}>
              {fornecedor.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Especificação Técnica</label>
        <textarea
          value={formData.especificacao_tecnica}
          onChange={(e) => setFormData({
            ...formData,
            especificacao_tecnica: e.target.value
          })}
          rows={4}
        />
      </div>

      <div>
        <label>Locais (Selecione múltiplos)</label>
        {locais.map(local => (
          <label key={local.id}>
            <input
              type="checkbox"
              checked={formData.locais_ids.includes(local.id)}
              onChange={() => handleLocaisChange(local.id)}
            />
            {local.nome}
          </label>
        ))}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Produto'}
      </button>
    </form>
  );
};

export default CriarProdutoPage;
```

---

## 🎨 Exemplo de Componente React - Criar Garantia

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, localService, fornecedorService, garantiaService } from '../services/apiService';

const CriarGarantiaPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [formData, setFormData] = useState({
    produto_id: null as number | null,
    local_id: null as number | null,
    fornecedor_id: null as number | null,
    duracao: '',
    data_compra: '',
    data_expiracao: '',
    cobertura: '',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosData, locaisData, fornecedoresData] = await Promise.all([
        produtoService.listar(),
        localService.listar(),
        fornecedorService.listar()
      ]);
      setProdutos(produtosData);
      setLocais(locaisData);
      setFornecedores(fornecedoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await garantiaService.criar({
        produto_id: formData.produto_id || undefined,
        local_id: formData.local_id || undefined,
        fornecedor_id: formData.fornecedor_id || undefined,
        duracao: formData.duracao || undefined,
        data_compra: formData.data_compra || undefined,
        data_expiracao: formData.data_expiracao || undefined,
        cobertura: formData.cobertura || undefined,
        descricao: formData.descricao || undefined
      });
      alert('Garantia criada com sucesso!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Produto</label>
        <select
          value={formData.produto_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            produto_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um produto</option>
          {produtos.map(produto => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Local</label>
        <select
          value={formData.local_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            local_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um local</option>
          {locais.map(local => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Fornecedor</label>
        <select
          value={formData.fornecedor_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            fornecedor_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um fornecedor</option>
          {fornecedores.map(fornecedor => (
            <option key={fornecedor.id} value={fornecedor.id}>
              {fornecedor.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Duração</label>
        <input
          type="text"
          value={formData.duracao}
          onChange={(e) => setFormData({ ...formData, duracao: e.target.value })}
          placeholder="Ex: 12 meses, 2 anos"
        />
      </div>

      <div>
        <label>Data de Compra</label>
        <input
          type="date"
          value={formData.data_compra}
          onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
        />
      </div>

      <div>
        <label>Data de Expiração</label>
        <input
          type="date"
          value={formData.data_expiracao}
          onChange={(e) => setFormData({ ...formData, data_expiracao: e.target.value })}
        />
      </div>

      <div>
        <label>Cobertura</label>
        <textarea
          value={formData.cobertura}
          onChange={(e) => setFormData({ ...formData, cobertura: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <label>Descrição</label>
        <textarea
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          rows={3}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Garantia'}
      </button>
    </form>
  );
};

export default CriarGarantiaPage;
```

---

## 🎨 Exemplo de Componente React - Criar Preventivo

```typescript
import React, { useState, useEffect } from 'react';
import { produtoService, localService, preventivoService, preventivoArquivoService } from '../services/apiService';

const CriarPreventivoPage: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [locais, setLocais] = useState<Local[]>([]);
  const [formData, setFormData] = useState({
    produto_id: null as number | null,
    local_id: null as number | null,
    data_preventiva: '',
    periodicidade: '',
    status: '',
    empresa_responsavel: '',
    tecnico_responsavel: '',
    custo: null as number | null,
    anotacoes: '',
    exigencia: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [produtosData, locaisData] = await Promise.all([
        produtoService.listar(),
        localService.listar()
      ]);
      setProdutos(produtosData);
      setLocais(locaisData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const preventivo = await preventivoService.criar({
        produto_id: formData.produto_id || undefined,
        local_id: formData.local_id || undefined,
        data_preventiva: formData.data_preventiva || undefined,
        periodicidade: formData.periodicidade || undefined,
        status: formData.status || undefined,
        empresa_responsavel: formData.empresa_responsavel || undefined,
        tecnico_responsavel: formData.tecnico_responsavel || undefined,
        custo: formData.custo || undefined,
        anotacoes: formData.anotacoes || undefined,
        exigencia: formData.exigencia || undefined
      });
      alert('Preventivo criado com sucesso!');
      // Navegar para tela de detalhes ou adicionar arquivos
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Produto</label>
        <select
          value={formData.produto_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            produto_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um produto</option>
          {produtos.map(produto => (
            <option key={produto.id} value={produto.id}>
              {produto.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Local</label>
        <select
          value={formData.local_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            local_id: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">Selecione um local</option>
          {locais.map(local => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Data Preventiva</label>
        <input
          type="date"
          value={formData.data_preventiva}
          onChange={(e) => setFormData({ ...formData, data_preventiva: e.target.value })}
        />
      </div>

      <div>
        <label>Periodicidade</label>
        <select
          value={formData.periodicidade}
          onChange={(e) => setFormData({ ...formData, periodicidade: e.target.value })}
        >
          <option value="">Selecione</option>
          <option value="mensal">Mensal</option>
          <option value="3 meses">3 meses</option>
          <option value="6 meses">6 meses</option>
          <option value="anual">Anual</option>
        </select>
      </div>

      <div>
        <label>Exigência</label>
        <select
          value={formData.exigencia}
          onChange={(e) => setFormData({ ...formData, exigencia: e.target.value })}
        >
          <option value="">Selecione</option>
          <option value="obrigatorio">Obrigatório</option>
          <option value="recomendado">Recomendado</option>
        </select>
      </div>

      <div>
        <label>Status</label>
        <input
          type="text"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        />
      </div>

      <div>
        <label>Empresa Responsável</label>
        <input
          type="text"
          value={formData.empresa_responsavel}
          onChange={(e) => setFormData({ ...formData, empresa_responsavel: e.target.value })}
        />
      </div>

      <div>
        <label>Técnico Responsável</label>
        <input
          type="text"
          value={formData.tecnico_responsavel}
          onChange={(e) => setFormData({ ...formData, tecnico_responsavel: e.target.value })}
        />
      </div>

      <div>
        <label>Custo</label>
        <input
          type="number"
          step="0.01"
          value={formData.custo || ''}
          onChange={(e) => setFormData({
            ...formData,
            custo: e.target.value ? parseFloat(e.target.value) : null
          })}
        />
      </div>

      <div>
        <label>Anotações</label>
        <textarea
          value={formData.anotacoes}
          onChange={(e) => setFormData({ ...formData, anotacoes: e.target.value })}
          rows={4}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Preventivo'}
      </button>
    </form>
  );
};

export default CriarPreventivoPage;
```

---

## 🎨 Exemplo de Componente React - Criar Sistema de Edificação

```typescript
import React, { useState, useEffect } from 'react';
import { sistemaEdificacaoService, garantiaService } from '../services/apiService';

const CriarSistemaEdificacaoPage: React.FC = () => {
  const [garantias, setGarantias] = useState<Garantia[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    norma: '',
    exigencia: '',
    cuidados_uso: '',
    garantias_ids: [] as number[]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarGarantias();
  }, []);

  const carregarGarantias = async () => {
    try {
      const garantiasData = await garantiaService.listar();
      setGarantias(garantiasData);
    } catch (error) {
      console.error('Erro ao carregar garantias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await sistemaEdificacaoService.criar({
        titulo: formData.titulo,
        norma: formData.norma || undefined,
        exigencia: formData.exigencia || undefined,
        cuidados_uso: formData.cuidados_uso || undefined,
        garantias_ids: formData.garantias_ids.length > 0 ? formData.garantias_ids : undefined
      });
      alert('Sistema criado com sucesso!');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGarantiaToggle = (garantiaId: number) => {
    setFormData(prev => {
      const garantiasIds = prev.garantias_ids.includes(garantiaId)
        ? prev.garantias_ids.filter(id => id !== garantiaId)
        : [...prev.garantias_ids, garantiaId];
      return { ...prev, garantias_ids: garantiasIds };
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Título *</label>
        <input
          type="text"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Norma</label>
        <input
          type="text"
          value={formData.norma}
          onChange={(e) => setFormData({ ...formData, norma: e.target.value })}
          placeholder="Ex: NBR 5674"
        />
      </div>

      <div>
        <label>Exigência</label>
        <select
          value={formData.exigencia}
          onChange={(e) => setFormData({ ...formData, exigencia: e.target.value })}
        >
          <option value="">Selecione</option>
          <option value="obrigatoria">Obrigatória</option>
          <option value="recomendada">Recomendada</option>
        </select>
      </div>

      <div>
        <label>Cuidados de Uso</label>
        <textarea
          value={formData.cuidados_uso}
          onChange={(e) => setFormData({ ...formData, cuidados_uso: e.target.value })}
          rows={4}
        />
      </div>

      <div>
        <label>Garantias Relacionadas (Selecione múltiplas)</label>
        {garantias.map(garantia => (
          <label key={garantia.id}>
            <input
              type="checkbox"
              checked={formData.garantias_ids.includes(garantia.id)}
              onChange={() => handleGarantiaToggle(garantia.id)}
            />
            {garantia.duracao} - {garantia.cobertura || 'Sem cobertura'}
          </label>
        ))}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Salvar Sistema'}
      </button>
    </form>
  );
};

export default CriarSistemaEdificacaoPage;
```

---

## 🎨 Exemplo de Componente React - Upload de Arquivo para Preventivo

```typescript
import React, { useState } from 'react';
import { preventivoArquivoService } from '../services/apiService';

const UploadArquivoPreventivo: React.FC<{ preventivoId: number }> = ({ preventivoId }) => {
  const [tipo, setTipo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!arquivo || !tipo) {
      alert('Selecione um arquivo e um tipo');
      return;
    }

    try {
      setUploading(true);

      // 1. Upload do arquivo para Supabase Storage (ou outro serviço)
      // Exemplo usando Supabase Storage:
      const formData = new FormData();
      formData.append('file', arquivo);

      // Aqui você faria o upload real para o storage
      // const { data: uploadData, error: uploadError } = await supabase.storage
      //   .from('preventivos')
      //   .upload(`${preventivoId}/${arquivo.name}`, arquivo);
      
      // Por enquanto, vamos simular uma URL
      const arquivoUrl = `https://storage.supabase.co/preventivos/${preventivoId}/${arquivo.name}`;

      // 2. Criar registro do arquivo
      await preventivoArquivoService.criar({
        preventivo_id: preventivoId,
        tipo: tipo,
        arquivo: arquivoUrl
      });

      alert('Arquivo enviado com sucesso!');
      setArquivo(null);
      setTipo('');
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div>
        <label>Tipo de Arquivo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Selecione</option>
          <option value="ART">ART</option>
          <option value="Nota fiscal">Nota fiscal</option>
          <option value="Foto">Foto</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <div>
        <label>Arquivo</label>
        <input type="file" onChange={handleFileChange} />
      </div>

      <button onClick={handleUpload} disabled={uploading || !arquivo || !tipo}>
        {uploading ? 'Enviando...' : 'Enviar Arquivo'}
      </button>
    </div>
  );
};

export default UploadArquivoPreventivo;
```

---

## ✅ Checklist de Implementação Front-end

### Tela de Fornecedores
- [ ] Listar todos os fornecedores
- [ ] Criar fornecedor (formulário com todos os campos)
- [ ] Editar fornecedor
- [ ] Excluir fornecedor
- [ ] Validação: `nome` obrigatório

### Tela de Locais
- [ ] Listar todos os locais
- [ ] Criar local (formulário com `nome` e `plano_preventivo`)
- [ ] Editar local
- [ ] Excluir local
- [ ] Validação: `nome` obrigatório

### Tela de Produtos
- [ ] Listar produtos (mostrar fornecedor e locais)
- [ ] Criar produto:
  - [ ] Campo `nome` (obrigatório)
  - [ ] Select de fornecedores (populado com GET `/api/fornecedores-novo`)
  - [ ] Select múltiplo de locais (populado com GET `/api/locais`)
  - [ ] Campo `especificacao_tecnica` (textarea)
- [ ] Editar produto (pode atualizar `locais_ids[]` para re-associar)
- [ ] Excluir produto
- [ ] Validação: `nome` obrigatório

### Tela de Garantias
- [ ] Listar garantias (mostrar produto, local, fornecedor)
- [ ] Criar garantia:
  - [ ] Select de produtos (populado com GET `/api/produtos-novo`)
  - [ ] Select de locais (populado com GET `/api/locais`)
  - [ ] Select de fornecedores (populado com GET `/api/fornecedores-novo`)
  - [ ] Date pickers para `data_compra` e `data_expiracao`
  - [ ] Campos de texto para `duracao`, `cobertura`, `descricao`, `perda_garantia`
- [ ] Editar garantia
- [ ] Excluir garantia

### Tela de Preventivos
- [ ] Listar preventivos (mostrar produto, local, status)
- [ ] Criar preventivo:
  - [ ] Select de produtos
  - [ ] Select de locais
  - [ ] Date picker para `data_preventiva`
  - [ ] Select de `periodicidade` (mensal, 3 meses, 6 meses, anual)
  - [ ] Select de `exigencia` (obrigatorio/recomendado)
  - [ ] Campo `status`
  - [ ] Campos `empresa_responsavel`, `tecnico_responsavel`
  - [ ] Campo `custo` (número decimal)
  - [ ] Textarea `anotacoes`
- [ ] Editar preventivo
- [ ] Excluir preventivo
- [ ] Upload de arquivos (via `/api/preventivo-arquivos`)
- [ ] Listar arquivos do preventivo (filtrar por tipo)

### Tela de Sistemas de Edificação
- [ ] Listar sistemas (mostrar garantias relacionadas)
- [ ] Criar sistema:
  - [ ] Campo `titulo` (obrigatório)
  - [ ] Campo `norma`
  - [ ] Select de `exigencia` (obrigatoria/recomendada)
  - [ ] Textarea `cuidados_uso`
  - [ ] Select múltiplo de garantias (populado com GET `/api/garantias-novo`)
- [ ] Editar sistema (pode atualizar `garantias_ids[]`)
- [ ] Excluir sistema
- [ ] Validação: `titulo` obrigatório

### Tela de Manutenções Preventivas
- [ ] Listar manutenções (mostrar local e produto)
- [ ] Criar manutenção:
  - [ ] Select de locais
  - [ ] Select de produtos
  - [ ] Campo `sistema_construtivo`
  - [ ] Campo `arquivos` (texto ou upload)
- [ ] Editar manutenção
- [ ] Excluir manutenção

---

## 🚨 Observações Importantes

1. **Relacionamentos Múltiplos:**
   - **Produtos com Locais:** Use `locais_ids[]` (array) ao criar/atualizar produto
   - **Sistemas com Garantias:** Use `garantias_ids[]` (array) ao criar/atualizar sistema
   - **Fornecedor-Produtos:** Use endpoint `/api/fornecedor-produtos` para associações N:N com especificação técnica específica

2. **Validação de Foreign Keys:**
   - Sempre valide se os IDs existem antes de criar/atualizar
   - O backend valida automaticamente, mas é bom ter validação no front-end também

3. **Formato de Datas:**
   - Use `YYYY-MM-DD` para envio ao backend
   - Formate para exibição no frontend (ex: "15/01/2025")

4. **Upload de Arquivos:**
   - Faça upload para Supabase Storage (ou outro serviço) primeiro
   - Depois crie registro via POST `/api/preventivo-arquivos` com a URL retornada

5. **Selects Populados:**
   - Sempre busque os dados relacionados (fornecedores, locais, produtos) antes de renderizar os selects
   - Use `useEffect` para carregar os dados quando o componente montar

6. **Tratamento de Erros:**
   - Sempre trate erros da API
   - Exiba mensagens amigáveis ao usuário
   - Valide campos obrigatórios antes de enviar

7. **Loading States:**
   - Mostre indicadores de carregamento durante requisições
   - Desabilite botões durante o envio

8. **Confirmações:**
   - Sempre peça confirmação antes de excluir registros

---

## 📝 Exemplos de Uso Completo

### Exemplo 1: Criar Produto com Fornecedor e Múltiplos Locais

```typescript
// 1. Buscar dados para os selects
const fornecedores = await fornecedorService.listar();
const locais = await localService.listar();

// 2. Criar produto
const novoProduto = {
  nome: "Ar Condicionado Split",
  fornecedor_id: 1, // Selecionado do dropdown
  especificacao_tecnica: "12.000 BTUs, Inverter",
  locais_ids: [1, 2, 3] // Selecionados do select múltiplo
};

const produtoCriado = await produtoService.criar(novoProduto);
console.log(produtoCriado.fornecedor); // Dados do fornecedor
console.log(produtoCriado.locais); // Array de locais associados
```

### Exemplo 2: Criar Garantia com Produto, Local e Fornecedor

```typescript
const novaGarantia = {
  produto_id: 1,
  local_id: 1,
  fornecedor_id: 1,
  duracao: "12 meses",
  data_compra: "2024-01-15",
  data_expiracao: "2025-01-15",
  cobertura: "Defeitos de fabricação"
};

const garantiaCriada = await garantiaService.criar(novaGarantia);
console.log(garantiaCriada.produto); // Dados do produto
console.log(garantiaCriada.local); // Dados do local
console.log(garantiaCriada.fornecedor); // Dados do fornecedor
```

### Exemplo 3: Criar Sistema de Edificação com Múltiplas Garantias

```typescript
const novoSistema = {
  titulo: "Drywall",
  norma: "NBR 5674",
  exigencia: "obrigatoria",
  cuidados_uso: "Manter ambiente ventilado...",
  garantias_ids: [1, 2, 3] // IDs selecionados do select múltiplo
};

const sistemaCriado = await sistemaEdificacaoService.criar(novoSistema);
console.log(sistemaCriado.garantias); // Array de garantias associadas
```

### Exemplo 4: Criar Preventivo e Adicionar Arquivos

```typescript
// 1. Criar preventivo
const novoPreventivo = {
  produto_id: 1,
  local_id: 1,
  data_preventiva: "2025-01-15",
  periodicidade: "mensal",
  status: "pendente",
  exigencia: "obrigatorio"
};

const preventivoCriado = await preventivoService.criar(novoPreventivo);

// 2. Upload de arquivo e criação do registro
const arquivo = // File do input
const arquivoUrl = // URL retornada do upload para storage

await preventivoArquivoService.criar({
  preventivo_id: preventivoCriado.id,
  tipo: "ART",
  arquivo: arquivoUrl
});
```

---

**Fim da Documentação**
