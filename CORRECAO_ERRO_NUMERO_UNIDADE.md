# 🔧 Correção: Erro "column unidade.numero does not exist"

## ❌ Problema Identificado

O erro `column unidade.numero does not exist` estava ocorrendo porque o backend estava tentando ordenar unidades por uma coluna `numero` que não existe no banco de dados.

## ✅ Correção Aplicada no Backend

**Arquivo:** `src/controllers/unidadeController.ts`

**Antes:**
```typescript
const { data, error } = await query.order('numero');
```

**Depois:**
```typescript
// Ordenar por ID (sempre existe) - remover ordenação por 'numero' que não existe
const { data, error } = await query.order('id', { ascending: true });
```

## 📋 IMPORTANTE: Nome Correto da Coluna

A coluna na tabela `unidade` provavelmente se chama:
- `numero_unidade` (mais comum)
- Ou pode não existir uma coluna de número

**Verifique no banco de dados qual é o nome correto da coluna que armazena o número da unidade.**

## 🔍 Como Verificar o Nome Correto da Coluna

### Opção 1: Via Supabase Dashboard
1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Selecione a tabela `unidade`
4. Veja quais colunas existem

### Opção 2: Via API de Debug
Execute no navegador (console):
```javascript
fetch('http://localhost:3000/api/unidades')
  .then(r => r.json())
  .then(data => {
    if (data.length > 0) {
      console.log('Colunas da unidade:', Object.keys(data[0]));
      console.log('Unidade exemplo:', data[0]);
    }
  });
```

## ✅ Se a Coluna for `numero_unidade`

Se você descobrir que a coluna se chama `numero_unidade`, atualize o `unidadeController.ts`:

```typescript
// Ordenar por numero_unidade se existir
const { data, error } = await query.order('numero_unidade', { ascending: true });
```

## ⚠️ Se Não Existir Coluna de Número

Se não existir uma coluna de número, você pode:
1. **Remover a ordenação** (já corrigido - ordena por ID)
2. **Ou criar a coluna** no banco de dados:
   ```sql
   ALTER TABLE unidade ADD COLUMN numero_unidade VARCHAR(50);
   ```

## 🎯 Correção no Front-End (Se Necessário)

Se o front-end estiver tentando acessar `unidade.numero`, atualize para usar o nome correto:

**Antes:**
```typescript
{unidade.numero}
```

**Depois:**
```typescript
{unidade.numero_unidade || unidade.id}
```

Ou verifique qual campo realmente existe:
```typescript
{unidade.numero_unidade || unidade.numero || unidade.id}
```

## ✅ Status da Correção

- ✅ Backend corrigido: ordenação alterada de `numero` para `id`
- ⚠️ Verificar: nome exato da coluna no banco de dados
- ⚠️ Atualizar front-end: se estiver usando `unidade.numero`

## 🧪 Teste

Após a correção, teste novamente:
1. Reinicie o servidor backend
2. Tente listar garantias novamente
3. Se ainda houver erro, verifique o nome correto da coluna no banco

---

**Última atualização:** Janeiro 2024
