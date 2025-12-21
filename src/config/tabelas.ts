// Nomes das tabelas no banco de dados Supabase
// Ajuste estes nomes conforme o schema real do seu banco de dados

export const TABELAS = {
  // Tabelas base
  FORNECEDORES: 'fornecedores',
  LOCAIS: 'locais',
  PRODUTOS: 'produtos',
  // Garantias
  GARANTIAS: 'garantias',
  // Preventivos
  PREVENTIVOS: 'preventivos',
  PREVENTIVO_ARQUIVOS: 'preventivo_arquivos',
  // Manutenção e Uso
  SISTEMAS_EDIFICACAO: 'sistemas_edificacao',
  SISTEMA_GARANTIAS: 'sistema_garantias',
  // Manutenções Preventivas
  MANUTENCOES_PREVENTIVAS: 'manutencoes_preventivas',
  // Relacionamentos
  FORNECEDOR_PRODUTOS: 'fornecedor_produtos',
  PRODUTO_LOCAIS: 'produto_locais',
  // Tabelas antigas (manter para compatibilidade se necessário)
  CONTATO: 'contato',
  EMPREENDIMENTO: 'empreendimento',
  UNIDADE: 'unidade',
  CHAMADO: 'chamado'
};

