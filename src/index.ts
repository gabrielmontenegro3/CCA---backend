import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente ANTES de importar outros módulos
dotenv.config();

import { supabase } from './config/supabase';
import { errorHandler } from './middleware/errorHandler';

// Importar rotas
import produtoRoutes from './routes/produtoRoutes';
import fornecedorRoutes from './routes/fornecedorRoutes';
import contatoRoutes from './routes/contatoRoutes';
import empreendimentoRoutes from './routes/empreendimentoRoutes';
import unidadeRoutes from './routes/unidadeRoutes';
import chamadoRoutes from './routes/chamadoRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import garantiaLoteRoutes from './routes/garantiaLoteRoutes';
// Novas rotas - Schema atualizado
import fornecedorNovoRoutes from './routes/fornecedorNovoRoutes';
import localRoutes from './routes/localRoutes';
import produtoNovoRoutes from './routes/produtoNovoRoutes';
import garantiaNovoRoutes from './routes/garantiaNovoRoutes';
import preventivoRoutes from './routes/preventivoRoutes';
import preventivoArquivoRoutes from './routes/preventivoArquivoRoutes';
import sistemaEdificacaoRoutes from './routes/sistemaEdificacaoRoutes';
import manutencaoPreventivaNovoRoutes from './routes/manutencaoPreventivaNovoRoutes';
import fornecedorProdutoRoutes from './routes/fornecedorProdutoRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Backend API funcionando!',
    version: '1.0.0'
  });
});

// Rota de health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'Supabase configurado'
  });
});

// Rotas da API
app.use('/api/produtos', produtoRoutes);
app.use('/api/fornecedores', fornecedorRoutes);
app.use('/api/contatos', contatoRoutes);
app.use('/api/empreendimentos', empreendimentoRoutes);
app.use('/api/unidades', unidadeRoutes);
app.use('/api/chamados', chamadoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/garantia-lote', garantiaLoteRoutes);
// Novas rotas - Schema atualizado
app.use('/api/fornecedores-novo', fornecedorNovoRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/produtos-novo', produtoNovoRoutes);
app.use('/api/garantias-novo', garantiaNovoRoutes);
app.use('/api/preventivos', preventivoRoutes);
app.use('/api/preventivo-arquivos', preventivoArquivoRoutes);
app.use('/api/sistemas-edificacao', sistemaEdificacaoRoutes);
app.use('/api/manutencoes-preventivas-novo', manutencaoPreventivaNovoRoutes);
app.use('/api/fornecedor-produtos', fornecedorProdutoRoutes);

// Rota de teste de conexão com Supabase
app.get('/test-db', async (_req: Request, res: Response) => {
  try {
    // Testa diferentes nomes de tabelas para identificar o padrão correto
    const tabelasParaTestar = [
      'Produto', 'produto', 'PRODUTO',
      'Fornecedor', 'fornecedor', 'FORNECEDOR',
      'Unidade', 'unidade', 'UNIDADE'
    ];
    
    const resultados: any = {};
    
    for (const tabela of tabelasParaTestar) {
      const { error } = await supabase.from(tabela).select('*').limit(1);
      resultados[tabela] = error ? error.message : 'OK';
    }
    
    res.json({
      status: 'Teste de tabelas',
      resultados,
      message: 'Verifique quais tabelas existem e ajuste os nomes nos controllers'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'Erro',
      message: 'Erro ao conectar com Supabase',
      error: error.message
    });
  }
});

// Rota de diagnóstico para verificar schema da tabela produto
app.get('/debug/produto-schema', async (_req: Request, res: Response) => {
  try {
    // Tentar buscar um produto para ver a estrutura
    const { data, error } = await supabase
      .from('produto')
      .select('*')
      .limit(1);
    
    if (error) {
      // Tentar com maiúscula
      const { data: data2, error: error2 } = await supabase
        .from('Produto')
        .select('*')
        .limit(1);
      
      if (error2) {
        return res.json({
          erro: 'Tabela não encontrada',
          tentativas: {
            'produto': error.message,
            'Produto': error2.message
          },
          sugestao: 'Verifique o nome exato da tabela no Supabase'
        });
      }
      
      return res.json({
        tabela_correta: 'Produto',
        estrutura: data2 && data2.length > 0 ? Object.keys(data2[0]) : 'Tabela vazia',
        exemplo: data2 && data2.length > 0 ? data2[0] : null
      });
    }
    
    return res.json({
      tabela_correta: 'produto',
      estrutura: data && data.length > 0 ? Object.keys(data[0]) : 'Tabela vazia',
      exemplo: data && data.length > 0 ? data[0] : null,
      colunas: data && data.length > 0 ? Object.keys(data[0]) : []
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'Erro',
      error: error.message
    });
  }
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Inicia o servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔌 Supabase configurado`);
  console.log(`\n📋 Endpoints disponíveis:`);
  console.log(`   GET    /api/produtos`);
  console.log(`   GET    /api/fornecedores`);
  console.log(`   GET    /api/contatos`);
  console.log(`   GET    /api/empreendimentos`);
  console.log(`   GET    /api/unidades`);
  console.log(`   GET    /api/chamados`);
  console.log(`   GET    /api/dashboard`);
  console.log(`   GET    /api/garantia-lote`);
  console.log(`   GET    /api/fornecedores-novo`);
  console.log(`   GET    /api/locais`);
  console.log(`   GET    /api/produtos-novo`);
  console.log(`   GET    /api/garantias-novo`);
  console.log(`   GET    /api/preventivos`);
  console.log(`   GET    /api/preventivo-arquivos`);
  console.log(`   GET    /api/sistemas-edificacao`);
  console.log(`   GET    /api/manutencoes-preventivas-novo`);
  console.log(`   GET    /api/fornecedor-produtos`);
});

// Tratamento de erros do servidor
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n❌ Erro: A porta ${PORT} já está em uso!`);
    console.error(`\n💡 Soluções:`);
    console.error(`   1. Encerre o processo que está usando a porta:`);
    console.error(`      netstat -ano | findstr :${PORT}`);
    console.error(`      taskkill /PID [número] /F`);
    console.error(`   2. Ou altere a porta no arquivo .env: PORT=3001\n`);
    process.exit(1);
  } else {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
});

export default app;







