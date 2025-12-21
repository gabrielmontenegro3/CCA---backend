import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

// Função auxiliar para calcular datas de garantia
const calcularGarantias = (
  dataBase: Date,
  prazoAbntMeses: number | null,
  prazoFabricaMeses: number | null
) => {
  const dataFimGarantiaAbnt = prazoAbntMeses
    ? new Date(dataBase)
    : null;
  if (dataFimGarantiaAbnt && prazoAbntMeses) {
    dataFimGarantiaAbnt.setMonth(dataFimGarantiaAbnt.getMonth() + prazoAbntMeses);
  }

  const dataFimGarantiaFabrica = prazoFabricaMeses
    ? new Date(dataBase)
    : null;
  if (dataFimGarantiaFabrica && prazoFabricaMeses) {
    dataFimGarantiaFabrica.setMonth(dataFimGarantiaFabrica.getMonth() + prazoFabricaMeses);
  }

  const hoje = new Date();

  const statusGarantiaAbnt = dataFimGarantiaAbnt
    ? hoje <= dataFimGarantiaAbnt
      ? 'VALIDA'
      : 'EXPIRADA'
    : null;

  const statusGarantiaFabrica = dataFimGarantiaFabrica
    ? hoje <= dataFimGarantiaFabrica
      ? 'VALIDA'
      : 'EXPIRADA'
    : null;

  return {
    data_fim_garantia_abnt: dataFimGarantiaAbnt?.toISOString().split('T')[0] || null,
    data_fim_garantia_fabrica: dataFimGarantiaFabrica?.toISOString().split('T')[0] || null,
    status_garantia_abnt: statusGarantiaAbnt,
    status_garantia_fabrica: statusGarantiaFabrica
  };
};

export const unidadeProdutoController = {
  // Listar produtos da unidade com cálculos de garantia
  getProdutosByUnidade: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Buscar unidade
      const { data: unidade, error: unidadeError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id)
        .single();

      if (unidadeError) throw unidadeError;

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      // Buscar empreendimento
      const { data: empreendimento, error: empreendimentoError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .eq('id', unidade.id_empreendimento)
        .single();

      if (empreendimentoError) throw empreendimentoError;

      // Buscar produtos da unidade
      const { data: produtosUnidade, error: produtosError } = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .select('*')
        .eq('id_unidade', id);

      if (produtosError) throw produtosError;

      // Buscar dados dos produtos
      const produtosIds = produtosUnidade?.map((upg: any) => upg.id_produto) || [];
      const { data: produtos, error: produtosDataError } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .in('id', produtosIds);

      if (produtosDataError) throw produtosDataError;

      // Criar mapa de produtos
      const produtosMap = new Map(produtos?.map((p: any) => [p.id, p]) || []);

      // Determinar data_base
      const dataBase = unidade.data_instalacao
        ? new Date(unidade.data_instalacao)
        : empreendimento?.data_entrega_chaves
        ? new Date(empreendimento.data_entrega_chaves)
        : new Date();

      // Calcular garantias para cada produto
      const produtosComGarantia = (produtosUnidade || []).map((item: any) => {
        const produto = produtosMap.get(item.id_produto) || {};
        const garantias = calcularGarantias(
          dataBase,
          produto.prazo_garantia_abnt_meses,
          produto.prazo_garantia_fabrica_meses
        );

        return {
          ...item,
          Produto: produto,
          data_base: dataBase.toISOString().split('T')[0],
          ...garantias
        };
      });

      return res.json(produtosComGarantia);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Adicionar produto à unidade
  addProdutoToUnidade: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { id_produto, data_instalacao, ...outrosCampos } = req.body;

      // Verificar se a unidade existe
      const { data: unidade, error: unidadeError } = await supabase
        .from(TABELAS.UNIDADE)
        .select('*')
        .eq('id', id)
        .single();

      if (unidadeError) throw unidadeError;

      if (!unidade) {
        return res.status(404).json({ error: 'Unidade não encontrada' });
      }

      // Buscar empreendimento
      const { data: empreendimento, error: empreendimentoError } = await supabase
        .from(TABELAS.EMPREENDIMENTO)
        .select('*')
        .eq('id', unidade.id_empreendimento)
        .single();

      if (empreendimentoError) throw empreendimentoError;

      // Verificar se o produto existe
      const { data: produto, error: produtoError } = await supabase
        .from(TABELAS.PRODUTOS)
        .select('*')
        .eq('id', id_produto)
        .single();

      if (produtoError) throw produtoError;

      if (!produto) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      // Determinar data_base
      const dataBase = data_instalacao
        ? new Date(data_instalacao)
        : unidade.data_instalacao
        ? new Date(unidade.data_instalacao)
        : empreendimento?.data_entrega_chaves
        ? new Date(empreendimento.data_entrega_chaves)
        : new Date();

      // Calcular garantias
      const garantias = calcularGarantias(
        dataBase,
        produto.prazo_garantia_abnt_meses,
        produto.prazo_garantia_fabrica_meses
      );

      // Inserir na tabela Unidade_Produto_Garantia
      const { data, error } = await supabase
        .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
        .insert({
          id_unidade: id,
          id_produto,
          data_instalacao: data_instalacao || unidade.data_instalacao,
          ...outrosCampos
        })
        .select('*')
        .single();

      if (error) throw error;

      return res.status(201).json({
        ...data,
        Produto: produto,
        data_base: dataBase.toISOString().split('T')[0],
        ...garantias
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};




