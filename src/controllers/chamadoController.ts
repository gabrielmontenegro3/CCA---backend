import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { TABELAS } from '../config/tabelas';

// Função auxiliar para verificar se produto está em garantia
const verificarGarantia = async (idUnidade: string, idProduto: string): Promise<boolean> => {
  try {
    // Buscar unidade
    const { data: unidade, error: unidadeError } = await supabase
      .from(TABELAS.UNIDADE)
      .select('*')
      .eq('id', idUnidade)
      .single();

    if (unidadeError || !unidade) return false;

    // Buscar empreendimento
    const { data: empreendimento, error: empreendimentoError } = await supabase
      .from(TABELAS.EMPREENDIMENTO)
      .select('*')
      .eq('id', unidade.id_empreendimento)
      .single();

    if (empreendimentoError || !empreendimento) return false;

    // Buscar produto
    const { data: produto, error: produtoError } = await supabase
      .from(TABELAS.PRODUTOS)
      .select('*')
      .eq('id', idProduto)
      .single();

    if (produtoError || !produto) return false;

    // Buscar relação unidade-produto
    const { data: unidadeProduto } = await supabase
      .from(TABELAS.UNIDADE_PRODUTO_GARANTIA)
      .select('*')
      .eq('id_unidade', idUnidade)
      .eq('id_produto', idProduto)
      .maybeSingle();

    // Determinar data_base
    const dataBase = unidadeProduto?.data_instalacao
      ? new Date(unidadeProduto.data_instalacao)
      : unidade.data_instalacao
      ? new Date(unidade.data_instalacao)
      : empreendimento?.data_entrega_chaves
      ? new Date(empreendimento.data_entrega_chaves)
      : new Date();

    const hoje = new Date();

    // Verificar garantia ABNT
    if (produto.prazo_garantia_abnt_meses) {
      const dataFimAbnt = new Date(dataBase);
      dataFimAbnt.setMonth(dataFimAbnt.getMonth() + produto.prazo_garantia_abnt_meses);
      if (hoje <= dataFimAbnt) return true;
    }

    // Verificar garantia fábrica
    if (produto.prazo_garantia_fabrica_meses) {
      const dataFimFabrica = new Date(dataBase);
      dataFimFabrica.setMonth(dataFimFabrica.getMonth() + produto.prazo_garantia_fabrica_meses);
      if (hoje <= dataFimFabrica) return true;
    }

    return false;
  } catch (error) {
    return false;
  }
};

export const chamadoController = {
  // Listar chamados (com filtros opcionais)
  getAll: async (req: Request, res: Response) => {
    try {
      const { id_unidade, tipo_chamado, status } = req.query;

      let query = supabase.from(TABELAS.CHAMADO).select('*');

      if (id_unidade) {
        query = query.eq('id_unidade', id_unidade);
      }

      if (tipo_chamado) {
        query = query.eq('tipo_chamado', tipo_chamado);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('data_abertura', { ascending: false });

      if (error) throw error;

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Buscar chamado por id
  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Criar chamado (com validação automática de garantia)
  create: async (req: Request, res: Response) => {
    try {
      const { id_unidade, id_produto, ...outrosCampos } = req.body;

      // Verificar garantia se produto foi informado
      let validacaoGarantia = null;
      if (id_unidade && id_produto) {
        const emGarantia = await verificarGarantia(id_unidade, id_produto);
        validacaoGarantia = emGarantia ? 'DENTRO_DA_GARANTIA' : 'FORA_DA_GARANTIA';
      }

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .insert({
          id_unidade,
          id_produto,
          validacao_garantia: validacaoGarantia,
          ...outrosCampos
        })
        .select('*')
        .single();

      if (error) throw error;

      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar chamado
  update: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .update(req.body)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Atualizar status do chamado
  updateStatus: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status é obrigatório' });
      }

      const { data, error } = await supabase
        .from(TABELAS.CHAMADO)
        .update({ status })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Chamado não encontrado' });
      }

      return res.json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};




